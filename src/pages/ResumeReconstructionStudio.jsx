import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavLogo from "../components/NavLogo";
import ThemeToggle from "../components/ThemeToggle";
import ResumePreview from "../components/ResumePreview";
import { uploadReconstructResume, enhanceReconstructBullet, exportResumePdf } from "../api";
import "./ResumeReconstructionStudio.css";

const ResumeReconstructionStudio = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [dragOver, setDragOver] = useState(false);
  const [profileName, setProfileName] = useState("PROFESSIONAL");
  const [status, setStatus] = useState("idle"); // idle | uploading | processing | done | error
  const [progressText, setProgressText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [reconstructData, setReconstructData] = useState(null); // ReconstructionResponse
  const [activeLeftTab, setActiveLeftTab] = useState("editor"); // editor | original | quality | explain
  const [originalFile, setOriginalFile] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [unclassifiedTargets, setUnclassifiedTargets] = useState({});

  useEffect(() => () => {
    if (originalFile?.url) URL.revokeObjectURL(originalFile.url);
  }, [originalFile?.url]);

  // Bullet point enhancer states
  const [enhancingIndex, setEnhancingIndex] = useState(null);
  const [enhancingExpIndex, setEnhancingExpIndex] = useState(null);
  const [originalBulletText, setOriginalBulletText] = useState("");
  const [enhancedBulletText, setEnhancedBulletText] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setStatus("uploading");
    setProgressText("Uploading document: 0%");
    setErrorMsg("");
    setOriginalFile({ name: file.name, type: file.type, url: URL.createObjectURL(file) });

    try {
      const res = await uploadReconstructResume(file, profileName, (event) => {
        if (event.total) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          setProgressText(percent === 100 ? "Uploaded. Extracting and mapping resume sections..." : `Uploading document: ${percent}%`);
          if (percent === 100) setStatus("processing");
        }
      });

      setReconstructData(res.data);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Ingestion and reconstruction pipeline failed. Please verify format.");
      setStatus("error");
    }
  };

  // Form field editors update
  const handleProfileInfoChange = (field, value) => {
    setReconstructData((prev) => {
      const updated = { ...prev };
      updated.resume.profileInfo = {
        ...updated.resume.profileInfo,
        [field]: value,
      };
      return updated;
    });
  };

  const handleContactInfoChange = (field, value) => {
    setReconstructData((prev) => {
      const updated = { ...prev };
      updated.resume.contactInfo = {
        ...updated.resume.contactInfo,
        [field]: value,
      };
      return updated;
    });
  };

  const handleExperienceChange = (index, field, value) => {
    setReconstructData((prev) => {
      const updated = { ...prev };
      const updatedExp = [...updated.resume.workExperience];
      updatedExp[index] = { ...updatedExp[index], [field]: value };
      updated.resume.workExperience = updatedExp;
      return updated;
    });
  };

  const handleSkillChange = (index, value) => {
    setReconstructData((prev) => {
      const updated = { ...prev };
      const updatedSkills = [...updated.resume.skills];
      updatedSkills[index] = { ...updatedSkills[index], name: value };
      updated.resume.skills = updatedSkills;
      return updated;
    });
  };

  const handleListChange = (section, index, field, value) => {
    setReconstructData((prev) => {
      const updated = { ...prev, resume: { ...prev.resume } };
      const rows = [...(updated.resume[section] || [])];
      rows[index] = { ...rows[index], [field]: value };
      updated.resume[section] = rows;
      return updated;
    });
  };

  const handleCustomSectionChange = (section, index, field, value) => {
    setReconstructData((prev) => {
      const updated = { ...prev, resume: { ...prev.resume } };
      const sections = { ...(updated.resume.customSections || {}) };
      const rows = [...(sections[section] || [])];
      rows[index] = { ...rows[index], [field]: value };
      sections[section] = rows;
      updated.resume.customSections = sections;
      return updated;
    });
  };

  const handleUnclassifiedChange = (index, value) => {
    setReconstructData((prev) => {
      const lines = [...(prev.unclassifiedContent || [])];
      lines[index] = value;
      return { ...prev, unclassifiedContent: lines };
    });
  };

  const assignUnclassified = (index) => {
    const line = reconstructData.unclassifiedContent?.[index];
    if (!line?.trim()) return;
    const destination = unclassifiedTargets[index] || "additional";
    setReconstructData((prev) => {
      const resume = { ...prev.resume };
      const remaining = [...(prev.unclassifiedContent || [])];
      remaining.splice(index, 1);
      if (destination === "summary") {
        const profileInfo = { ...(resume.profileInfo || {}) };
        profileInfo.summary = [profileInfo.summary, line].filter(Boolean).join("\n");
        resume.profileInfo = profileInfo;
      } else if (destination === "experience") {
        resume.workExperience = [...(resume.workExperience || []), { description: line }];
      } else if (destination === "education") {
        resume.education = [...(resume.education || []), { description: line }];
      } else if (destination === "projects") {
        resume.projects = [...(resume.projects || []), { title: line }];
      } else if (destination === "certifications") {
        resume.certifications = [...(resume.certifications || []), { title: line }];
      } else {
        const section = destination === "publications" ? "publications" : "additional";
        const customSections = { ...(resume.customSections || {}) };
        customSections[section] = [...(customSections[section] || []), { title: line }];
        resume.customSections = customSections;
      }
      return { ...prev, resume, unclassifiedContent: remaining };
    });
    setUnclassifiedTargets((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const downloadReconstructedPdf = async () => {
    const element = document.getElementById("resume-preview");
    if (!element) return setErrorMsg("Resume preview is not ready for export.");
    setIsExporting(true);
    setErrorMsg("");
    try {
      let css = "";
      const links = [];
      for (const sheet of document.styleSheets) {
        try {
          css += Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\n") + "\n";
        } catch {
          if (sheet.href) links.push(`<link rel="stylesheet" href="${new URL(sheet.href, window.location.href).href}">`);
        }
      }
      css = css.replace(/@media\s*\(\s*max-width\s*:\s*900px\s*\)/g, "@media (max-width: 500px)");
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>VResIQ reconstructed resume</title>${links.join("")}<style>${css}</style><style>html,body{margin:0;padding:0;background:#fff}body *{visibility:visible!important}#resume-preview{position:relative!important;top:auto!important;left:auto!important;min-height:auto!important;height:auto!important;margin:0!important;width:100%!important;max-width:100%!important;overflow:visible!important;box-shadow:none!important}</style></head><body>${element.outerHTML}</body></html>`;
      const response = await exportResumePdf("reconstruction-draft", html, false);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(originalFile?.name || "reconstructed-resume").replace(/\.[^.]+$/, "")}-vresiq.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg("PDF export failed. The reconstruction is still available in the editor; retry after checking the export service.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTemplateChange = (val) => {
    setReconstructData((prev) => {
      const updated = { ...prev };
      updated.resume.template = val;
      updated.recommendedTemplate = val;
      return updated;
    });
  };

  // Bullet Point Enhancer Modal Trigger
  const triggerEnhanceBullet = async (expIndex, bulletText) => {
    setEnhancingExpIndex(expIndex);
    setOriginalBulletText(bulletText);
    setEnhancedBulletText("");
    setIsEnhancing(true);

    try {
      const res = await enhanceReconstructBullet(bulletText, "professional");
      setEnhancedBulletText(res.data.enhancedText);
    } catch (err) {
      alert("Failed to enhance bullet text: " + (err.response?.data?.error || err.message));
    } finally {
      setIsEnhancing(false);
    }
  };

  const acceptEnhancedBullet = () => {
    if (enhancedBulletText) {
      handleExperienceChange(enhancingExpIndex, "description", enhancedBulletText);
    }
    closeEnhancer();
  };

  const closeEnhancer = () => {
    setEnhancingExpIndex(null);
    setOriginalBulletText("");
    setEnhancedBulletText("");
    setIsEnhancing(false);
  };

  return (
    <div className="reconstruct-studio">
      <nav className="studio-nav">
        <NavLogo className="dash-logo" />
        <div className="studio-nav-right">
          <Link to="/admin" className="nav-link">Admin Panel</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <ThemeToggle />
          <span className="admin-badge">Admin</span>
        </div>
      </nav>

      <div className="studio-title-bar">
        <span className="studio-kicker">Enterprise Engine</span>
        <h1>Resume Reconstruction Studio</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          Ingest unstructured CVs from any platform and reconstruct them into optimized VResIQ schema models.
        </p>
      </div>

      <div className="studio-body">
        {status === "idle" && (
          <div
            className={`upload-container ${dragOver ? "drag-over" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">📂</div>
            <h2>Drag & drop candidate resume</h2>
            <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Supports PDF and DOCX files up to 10MB</p>

            <div className="profile-select-wrap">
              <label style={{ fontSize: "0.9rem", fontWeight: "600" }}>Reconstruction Profile:</label>
              <select
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="profile-select"
              >
                <option value="PROFESSIONAL">Professional Default</option>
                <option value="ATS_CONSERVATIVE">ATS Conservative</option>
                <option value="EXECUTIVE">Executive High-Impact</option>
                <option value="STUDENT">Student Starter</option>
              </select>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-refresh"
              style={{ marginTop: "2rem", padding: "0.75rem 2rem", width: "auto" }}
            >
              Browse Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx"
              style={{ display: "none" }}
            />
          </div>
        )}

        {(status === "uploading" || status === "processing") && (
          <div className="upload-container" style={{ padding: "4rem" }}>
            <div className="spinner" style={{ width: "48px", height: "48px", margin: "0 auto 2rem" }} />
            <h2>Processing Ingestion Pipeline</h2>
            <p style={{ color: "#3b82f6", fontWeight: "600", marginTop: "1rem" }}>{progressText}</p>
          </div>
        )}

        {status === "error" && (
          <div className="upload-container" style={{ borderColor: "#ef4444" }}>
            <div className="upload-icon" style={{ color: "#ef4444" }}>⚠️</div>
            <h2>Reconstruction Ingestion Error</h2>
            <p style={{ color: "#ef4444", marginTop: "0.5rem" }}>{errorMsg}</p>
            <button
              onClick={() => setStatus("idle")}
              className="btn-refresh"
              style={{ marginTop: "2rem", width: "auto" }}
            >
              Try Again
            </button>
          </div>
        )}

        {status === "done" && reconstructData && (
          <div className="studio-workspace">
            {/* Left Side: Pipeline Control, Form Editor, Metrics & Traces */}
            <div className="workspace-left">
              <div className="studio-tabs">
                <button
                  className={`tab-btn ${activeLeftTab === "editor" ? "active" : ""}`}
                  onClick={() => setActiveLeftTab("editor")}
                >
                  Form Editor
                </button>
                <button
                  className={`tab-btn ${activeLeftTab === "original" ? "active" : ""}`}
                  onClick={() => setActiveLeftTab("original")}
                >
                  Original
                </button>
                <button
                  className={`tab-btn ${activeLeftTab === "quality" ? "active" : ""}`}
                  onClick={() => setActiveLeftTab("quality")}
                >
                  Confidence & Gates
                </button>
                <button
                  className={`tab-btn ${activeLeftTab === "explain" ? "active" : ""}`}
                  onClick={() => setActiveLeftTab("explain")}
                >
                  Explainability Trace
                </button>
              </div>

              {activeLeftTab === "editor" && (
                <div className="tab-panel">
                  {/* Summary & Name */}
                  <div className="form-section">
                    <h3>Profile Info</h3>
                    <div className="form-group" style={{ marginTop: "1rem" }}>
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={reconstructData.resume.profileInfo?.fullName || ""}
                        onChange={(e) => handleProfileInfoChange("fullName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Designation</label>
                      <input
                        type="text"
                        value={reconstructData.resume.profileInfo?.designation || ""}
                        onChange={(e) => handleProfileInfoChange("designation", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Recruiter Summary</label>
                      <textarea
                        rows={4}
                        value={reconstructData.resume.profileInfo?.summary || ""}
                        onChange={(e) => handleProfileInfoChange("summary", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Contact Details</h3>
                    {["email", "phone", "location", "linkedIn", "github", "website"].map((field) => {
                      const value = reconstructData.resume.contactInfo?.[field];
                      return (
                        <div className="form-group" key={field}>
                          <label>{field === "linkedIn" ? "LinkedIn" : field === "github" ? "GitHub" : field[0].toUpperCase() + field.slice(1)}</label>
                          <input
                            type="text"
                            value={typeof value === "string" || typeof value === "number" ? value : value?.url || ""}
                            onChange={(e) => handleContactInfoChange(field, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Experiences */}
                  <div className="form-section">
                    <h3>Work Experiences</h3>
                    {(reconstructData.resume.workExperience || []).map((exp, idx) => (
                      <div key={idx} style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem" }}>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Company</label>
                            <input
                              type="text"
                              value={exp.company || ""}
                              onChange={(e) => handleExperienceChange(idx, "company", e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Role</label>
                            <input
                              type="text"
                              value={exp.role || ""}
                              onChange={(e) => handleExperienceChange(idx, "role", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Start Date</label>
                            <input
                              type="text"
                              value={exp.startDate || ""}
                              onChange={(e) => handleExperienceChange(idx, "startDate", e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>End Date</label>
                            <input
                              type="text"
                              value={exp.endDate || ""}
                              onChange={(e) => handleExperienceChange(idx, "endDate", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <label>Description Bullets</label>
                            <button
                              onClick={() => triggerEnhanceBullet(idx, exp.description)}
                              className="btn-refresh"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", width: "auto" }}
                            >
                              ✨ AI Improve wording
                            </button>
                          </div>
                          <textarea
                            rows={5}
                            value={exp.description || ""}
                            onChange={(e) => handleExperienceChange(idx, "description", e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  <div className="form-section">
                    <h3>Skills</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                      {(reconstructData.resume.skills || []).map((s, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={s.name || ""}
                          onChange={(e) => handleSkillChange(idx, e.target.value)}
                          style={{
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff",
                            padding: "0.5rem",
                            borderRadius: "6px",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Education</h3>
                    {(reconstructData.resume.education || []).map((item, idx) => (
                      <div key={idx} className="form-section" style={{ marginTop: "1rem" }}>
                        {["degree", "institution", "startDate", "endDate", "location", "gpa"].map((field) => (
                          <div className="form-group" key={field}>
                            <label>{field.replace(/([A-Z])/g, " $1")}</label>
                            <input value={item[field] || ""} onChange={(e) => handleListChange("education", idx, field, e.target.value)} />
                          </div>
                        ))}
                        <label>Description</label>
                        <textarea rows={3} value={item.description || ""} onChange={(e) => handleListChange("education", idx, "description", e.target.value)} />
                      </div>
                    ))}
                  </div>

                  <div className="form-section">
                    <h3>Projects</h3>
                    {(reconstructData.resume.projects || []).map((item, idx) => (
                      <div className="form-group" key={idx}>
                        <label>Extracted line {idx + 1}</label>
                        <textarea rows={2} value={item.title || ""} onChange={(e) => handleListChange("projects", idx, "title", e.target.value)} />
                      </div>
                    ))}
                  </div>

                  <div className="form-section">
                    <h3>Certifications</h3>
                    {(reconstructData.resume.certifications || []).map((item, idx) => (
                      <div className="form-group" key={idx}>
                        <label>Extracted line {idx + 1}</label>
                        <input value={item.title || ""} onChange={(e) => handleListChange("certifications", idx, "title", e.target.value)} />
                      </div>
                    ))}
                  </div>

                  <div className="form-section">
                    <h3>Publications and Other Sections</h3>
                    {Object.entries(reconstructData.resume.customSections || {}).map(([section, rows]) => (
                      <div key={section} style={{ marginTop: "1rem" }}>
                        <h4>{section}</h4>
                        {rows.map((item, idx) => (
                          <div className="form-group" key={`${section}-${idx}`}>
                            <label>Extracted line {idx + 1}</label>
                            <textarea rows={2} value={item.title || item.description || item.url || ""} onChange={(e) => handleCustomSectionChange(section, idx, "title", e.target.value)} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLeftTab === "original" && (
                <div className="tab-panel">
                  <h3>Original document{originalFile?.name ? `: ${originalFile.name}` : ""}</h3>
                  {originalFile?.type === "application/pdf" ? (
                    <iframe className="original-document-frame" title="Original resume PDF" src={originalFile.url} />
                  ) : originalFile ? (
                    <div className="original-document-placeholder">
                      <p>DOCX preview is not available in this browser. Open the source file and compare it with the reconstructed preview.</p>
                      <a href={originalFile.url} download={originalFile.name}>Download original DOCX</a>
                    </div>
                  ) : <p>The source document is unavailable for preview.</p>}
                  <p className="original-compare-hint">The reconstructed document remains visible beside this panel.</p>
                </div>
              )}

              {activeLeftTab === "quality" && (
                <div className="tab-panel">
                  <h3>Quality Gates</h3>
                  <p style={{ color: "#fbbf24", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    Parse checks are heuristic. ATS scoring is not run during reconstruction.
                  </p>
                  <div style={{ marginTop: "1rem" }}>
                    <div className="gate-item">
                      <span className={`gate-icon ${reconstructData.qualityGates.requiredSectionsExist ? "passed" : "failed"}`}>
                        {reconstructData.qualityGates.requiredSectionsExist ? "✓" : "✗"}
                      </span>
                      <div>
                        <strong>Required Sections Check</strong>
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Assert work history and profile integrity exist.</p>
                      </div>
                    </div>

                    <div className="gate-item">
                      <span className={`gate-icon ${reconstructData.qualityGates.contactInfoValid ? "passed" : "failed"}`}>
                        {reconstructData.qualityGates.contactInfoValid ? "✓" : "✗"}
                      </span>
                      <div>
                        <strong>Contact Info Validation</strong>
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Assert candidate email or phone digits parsed successfully.</p>
                      </div>
                    </div>
                    <div className="gate-item">
                      <span className={`gate-icon ${reconstructData.qualityGates.noDuplicateSections ? "passed" : "failed"}`}>
                        {reconstructData.qualityGates.noDuplicateSections ? "✓" : "!"}
                      </span>
                      <div>
                        <strong>Repeated Sections</strong>
                        <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Repeated headings and content are retained and flagged.</p>
                      </div>
                    </div>
                  </div>

                  {(reconstructData.warnings || []).length > 0 && (
                    <div className="form-section" style={{ marginTop: "1.25rem" }}>
                      <h3>Review Warnings</h3>
                      <ul>{reconstructData.warnings.map((warning, idx) => <li key={idx}>{warning}</li>)}</ul>
                    </div>
                  )}
                  {(reconstructData.unclassifiedContent || []).length > 0 && (
                    <div className="form-section">
                      <h3>Unclassified Content</h3>
                      <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Edit each source line, then assign it to a resume section.</p>
                      {(reconstructData.unclassifiedContent || []).map((line, idx) => (
                        <div key={idx} className="form-group" style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <textarea rows={2} value={line} onChange={(e) => handleUnclassifiedChange(idx, e.target.value)} />
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <select value={unclassifiedTargets[idx] || "additional"} onChange={(e) => setUnclassifiedTargets((prev) => ({ ...prev, [idx]: e.target.value }))}>
                              <option value="additional">Additional information</option>
                              <option value="summary">Summary</option>
                              <option value="experience">Experience</option>
                              <option value="education">Education</option>
                              <option value="projects">Projects</option>
                              <option value="certifications">Certifications</option>
                              <option value="publications">Publications</option>
                            </select>
                            <button type="button" className="btn-refresh" onClick={() => assignUnclassified(idx)} style={{ width: "auto" }}>Assign line</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h3 style={{ marginTop: "2rem" }}>Confidence Report</h3>
                  <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Found means a value was parsed; factual accuracy is not verified.</p>
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {Object.entries(reconstructData.confidenceReport).map(([sec, score]) => (
                      <div key={sec} style={{ display: "flex", justifyContent: "space-between", background: "rgba(15,23,42,0.4)", padding: "0.75rem", borderRadius: "6px" }}>
                        <span>{sec}</span>
                        <strong style={{ color: score === 1 ? "#10b981" : "#f59e0b" }}>{score === 1 ? "Found" : "Not detected"}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLeftTab === "explain" && (
                <div className="tab-panel">
                  <h3>AI Transformation Explainability Logs</h3>
                  <div style={{ marginTop: "1rem" }}>
                    {reconstructData.explainabilityRecords.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No factual updates or AI rewrites were automatically applied.</p>
                    ) : (
                      reconstructData.explainabilityRecords.map((rec, idx) => (
                        <div key={idx} className="explain-card">
                          <strong>Field: {rec.field}</strong>
                          <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.25rem" }}>Reason: {rec.reason}</p>
                          <div className="explain-diff">
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Original</span>
                              <div className="diff-orig">{rec.original}</div>
                            </div>
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Improved</span>
                              <div className="diff-imp">{rec.improved}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <h3 style={{ marginTop: "2rem" }}>Ingestion Trace Timeline</h3>
                  <div style={{ marginTop: "1rem" }} className="trace-log">
                    {reconstructData.stages.map((stage, idx) => (
                      <div key={idx} className="trace-item">
                        <div>
                          <strong>{stage.name}</strong>
                          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.25rem" }}>{stage.detail}</p>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#3b82f6" }}>{stage.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Reconstructed Resume Live Preview */}
            <div className="workspace-right">
              <div className="preview-header-bar">
                <div>
                  <h3 style={{ color: "#111" }}>Reconstructed Live View</h3>
                  <span style={{ fontSize: "0.8rem", color: "#666" }}>ATS analysis not run</span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    value={reconstructData.recommendedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="engineer_ats">Frame Template (ATS)</option>
                    <option value="consulting_bcg">Summit Template (BCG)</option>
                    <option value="swiss_minimal">Metro Template</option>
                    <option value="harvard_ats">Harvard ATS</option>
                  </select>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                <ResumePreview resume={reconstructData.resume} isFreePlan={false} paginationMode="flow" />
              </div>

              {errorMsg && <p role="alert" style={{ color: "#ef4444", marginTop: "1rem" }}>{errorMsg}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={downloadReconstructedPdf}
                  disabled={isExporting}
                  className="btn-refresh"
                  style={{ width: "100%", background: "#10b981", color: "#fff" }}
                >
                  {isExporting ? "Generating PDF…" : "Download Reconstructed PDF"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bullet Enhancer Modal Dialog */}
      {enhancingExpIndex !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#1e293b",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <h3 style={{ color: "#fff" }}>AI Bullet Point Enhancer</h3>
            <div style={{ marginTop: "1rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Original Text:</label>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.75rem", borderRadius: "6px", marginTop: "0.25rem", fontSize: "0.9rem" }}>
                {originalBulletText}
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Recruiter-Grade Suggestion:</label>
              {isEnhancing ? (
                <div style={{ color: "#3b82f6", marginTop: "0.5rem" }}>Running Gemini AI analysis...</div>
              ) : (
                <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "0.75rem", borderRadius: "6px", marginTop: "0.25rem", fontSize: "0.9rem" }}>
                  {enhancedBulletText || "Drafting enhanced phrasing..."}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
              <button onClick={closeEnhancer} className="btn-refresh" style={{ width: "auto", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                Cancel
              </button>
              <button onClick={acceptEnhancedBullet} disabled={!enhancedBulletText} className="btn-refresh" style={{ width: "auto", background: "#10b981", color: "#fff" }}>
                Apply Improvement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeReconstructionStudio;
