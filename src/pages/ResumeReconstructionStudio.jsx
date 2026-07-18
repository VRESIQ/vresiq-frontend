import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavLogo from "../components/NavLogo";
import ThemeToggle from "../components/ThemeToggle";
import ResumePreview from "../components/ResumePreview";
import { uploadReconstructResume, enhanceReconstructBullet } from "../api";
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
    setProgressText("Uploading document securely...");
    setErrorMsg("");

    try {
      // Simulate progress ticks
      const progressInterval = setInterval(() => {
        setProgressText((prev) => {
          if (prev.includes("Uploading")) return "Parsing PDF layout structure...";
          if (prev.includes("Parsing")) return "Extracting raw text segments...";
          if (prev.includes("Extracting")) return "Standardizing dates & contact details...";
          if (prev.includes("Standardizing")) return "Running LLM semantic enrichment...";
          return "Finalizing resume schema...";
        });
      }, 1500);

      const res = await uploadReconstructResume(file, profileName);
      clearInterval(progressInterval);

      setReconstructData(res.data);
      setStatus("done");
    } catch (err) {
      console.error(err);
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
                </div>
              )}

              {activeLeftTab === "quality" && (
                <div className="tab-panel">
                  <h3>Quality Gates</h3>
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
                  </div>

                  <h3 style={{ marginTop: "2rem" }}>Confidence Report</h3>
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {Object.entries(reconstructData.confidenceReport).map(([sec, score]) => (
                      <div key={sec} style={{ display: "flex", justifyContent: "space-between", background: "rgba(15,23,42,0.4)", padding: "0.75rem", borderRadius: "6px" }}>
                        <span>{sec}</span>
                        <strong style={{ color: score >= 0.8 ? "#10b981" : "#f59e0b" }}>{(score * 100).toFixed(0)}%</strong>
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
                  <span style={{ fontSize: "0.8rem", color: "#666" }}>ATS Score: {reconstructData.resume.lastAtsScore}/100</span>
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
                  </select>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                <ResumePreview resume={reconstructData.resume} isFreePlan={false} />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={() => alert("Reconstructed resume successfully saved to Database! (In production, this creates a draft and navigates back)")}
                  className="btn-refresh"
                  style={{ width: "100%", background: "#10b981", color: "#fff" }}
                >
                  Save to Database
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
