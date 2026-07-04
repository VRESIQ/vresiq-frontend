import { useEffect, useState } from "react";
import { loadingService } from "../../utils/loadingService";
import { toastService } from "../../utils/toastService";
import "./GlobalLoader.css";

/*
Purpose: Renders standard VRESIQ notifications, Category C floating progress indicators, and Category D fullscreen loaders with escalation rules.
*/

const TIPS = [
  // ATS Tips
  { category: "ATS Tips", text: "ATS software parses resumes from top to bottom. Avoid multi-column layouts for maximum compatibility." },
  { category: "ATS Tips", text: "Standardize section headings like 'Work Experience' and 'Education' so parsing tools identify them easily." },
  { category: "ATS Tips", text: "Use standard bullet points instead of custom symbols, which can confuse ATS parser algorithms." },
  { category: "ATS Tips", text: "Save and upload your resume as a PDF. VRESIQ's templates are fully optimized for PDF text layout extraction." },
  { category: "ATS Tips", text: "Tailor your resume skills to match key verbs and terms found directly in the job description." },
  { category: "ATS Tips", text: "Avoid placing important contact details or links inside the header or footer fields, as some parsers ignore them." },

  // Resume Tips
  { category: "Resume Tips", text: "Start bullet points with strong action verbs like 'Developed', 'Led', or 'Optimized' rather than 'Responsible for'." },
  { category: "Resume Tips", text: "Quantify your achievements. 'Grew revenue by 20%' is always stronger than 'Helped grow revenue'." },
  { category: "Resume Tips", text: "Keep your resume to 1 page if you have under 5 years of experience, or 2 pages for senior roles." },
  { category: "Resume Tips", text: "Review your spelling and grammar meticulously. Even a single typo can lead to immediate rejection." },
  { category: "Resume Tips", text: "Put your most recent work experience first. Reverse chronological order is the recruiter standard." },
  { category: "Resume Tips", text: "Align your resume design to be clean and minimal. Let white space guide the reader's eyes naturally." },

  // Interview Tips
  { category: "Interview Tips", text: "Prepare at least three questions to ask the interviewer. It shows genuine curiosity and engagement." },
  { category: "Interview Tips", text: "Use the STAR method (Situation, Task, Action, Result) to structure answers to behavioral questions." },
  { category: "Interview Tips", text: "Research the company's product, mission, and recent press releases before walking into the interview." },
  { category: "Interview Tips", text: "Test your camera, microphone, and internet connection at least 15 minutes before a remote video interview." },
  { category: "Interview Tips", text: "Practice explaining your projects in under 2 minutes. Focus on what you did and why it mattered." },
  { category: "Interview Tips", text: "Follow up with a brief, personalized thank-you email within 24 hours of completing your interview." },

  // VRESIQ Features
  { category: "VRESIQ Features", text: "You can customize template accent colors to fit your target company's branding in one click." },
  { category: "VRESIQ Features", text: "Switch templates instantly inside the editor. Your content is preserved and reflowed automatically." },
  { category: "VRESIQ Features", text: "Verify your resume's ATS compatibility using our interactive scorer before exporting." },
  { category: "VRESIQ Features", text: "Pro users can email their generated resume PDF directly to recruiters from the dashboard." },
  { category: "VRESIQ Features", text: "Use the AI rewrite assistant to refine bullet points for professional impact." },
  { category: "VRESIQ Features", text: "Add customizable custom sections to tailor your resume for academic or creative roles." }
];

const GlobalLoader = () => {
  const [requests, setRequests] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = loadingService.subscribe((activeReqs) => {
      setRequests(activeReqs);
      if (activeReqs.length === 0) {
        setElapsed(0);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (requests.length === 0) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [requests]);

  useEffect(() => {
    if (requests.length === 0) return;

    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [requests]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 2800);
    });
    return unsubscribe;
  }, []);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const renderToasts = () => {
    if (toasts.length === 0) return null;
    return (
      <div className="v-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`v-toast v-toast-${toast.type}`} onClick={() => handleDismissToast(toast.id)}>
            <span className="v-toast-icon">
              {toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "ℹ"}
            </span>
            <span className="v-toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    );
  };

  if (requests.length === 0) {
    return renderToasts();
  }

  const primaryReq = requests[0];
  const url = primaryReq.url || "";
  const method = primaryReq.method || "GET";

  const isHeavy = url.includes("/api/ai/") || 
                  url.includes("/api/email/") || 
                  url.includes("/export-pdf") || 
                  url.includes("pdf") || 
                  url.includes("/upload-image") || 
                  url.includes("/upload-images");

  let titleText = "Processing request";
  let descText = "Please wait a moment...";

  if (url.includes("/api/auth/profile") && method === "GET") {
    titleText = "Loading profile";
    descText = "Fetching your workspace environment.";
  } else if (url.includes("/api/auth/login") && method === "POST") {
    titleText = "Signing you in";
    descText = "Authenticating credentials and loading session.";
  } else if (url.includes("/api/auth/register") && method === "POST") {
    titleText = "Creating account";
    descText = "Registering user and initializing settings.";
  } else if (url.includes("/api/resumes") && method === "GET") {
    titleText = "Loading dashboard";
    descText = "Fetching your resume documents.";
  } else if (url.includes("/api/resumes") && method === "POST") {
    titleText = "Generating resume";
    descText = "Assembling template and database record.";
  } else if ((url.includes("/api/resumes") || url.includes("/export-pdf")) && method === "POST" && (url.includes("/export-pdf") || JSON.stringify(primaryReq).includes("pdf"))) {
    titleText = "Exporting PDF document";
    descText = "Rendering template and exporting high-resolution PDF.";
  } else if (url.includes("/api/resumes") && method === "PUT" && url.includes("/export-pdf")) {
    titleText = "Exporting PDF document";
    descText = "Rendering template and exporting high-resolution PDF.";
  } else if (url.includes("/api/resumes") && method === "PUT") {
    titleText = "Saving changes";
    descText = "Syncing document edits to cloud storage.";
  } else if (url.includes("/api/payment/create-order")) {
    titleText = "Connecting payment gateway";
    descText = "Preparing secure checkout.";
  } else if (url.includes("/api/payment/verify")) {
    titleText = "Verifying payment transaction";
    descText = "Securing subscription status.";
  } else if (url.includes("/api/email/send-resume")) {
    titleText = "Sending email";
    descText = "Processing email delivery with PDF attachment.";
  } else if (url.includes("/api/ai/refine")) {
    titleText = "Analyzing resume (ATS)";
    descText = "Running keywords extraction, formatting checks, and scoring.";
  } else if (url.includes("/api/ai/rewrite")) {
    titleText = "Rewriting content";
    descText = "Polishing text to sound more professional with AI.";
  }

  const showFullscreen = isHeavy || elapsed >= 8;
  const showCompact = !isHeavy && elapsed >= 3 && elapsed < 8;

  if (showFullscreen) {
    let progressPercent = 20;
    if (elapsed >= 10 && elapsed < 30) progressPercent = 40;
    else if (elapsed >= 30 && elapsed < 60) progressPercent = 60;
    else if (elapsed >= 60 && elapsed < 90) progressPercent = 80;
    else if (elapsed >= 90) progressPercent = 95;

    const getStageIcon = (stageId) => {
      switch (stageId) {
        case 1: return "✓";
        case 2: return elapsed >= 10 ? "✓" : "⏳";
        case 3: return elapsed >= 30 ? "✓" : "⏳";
        case 4: return elapsed >= 60 ? "✓" : "⏳";
        case 5: return "⏳";
        default: return "⏳";
      }
    };

    const isExtended = elapsed >= 30;

    return (
      <>
        {renderToasts()}
        <div className="global-loader-overlay">
          <div className={`global-loader-card ${isExtended ? "cold-start-active" : ""}`}>
            <div className="nav-logo" style={{ fontSize: '1.8rem', pointerEvents: 'none', textDecoration: 'none', marginBottom: '8px' }}>
              <span className="logo-v">V</span>
              <span className="logo-res">RES</span>
              <span className="logo-iq">IQ</span>
            </div>

            <div className="global-loader-header">
              <span className={`status-badge ${elapsed >= 60 ? "badge-warning" : "badge-info"}`}>
                {elapsed >= 60 ? "Unusually Slow" : elapsed >= 30 ? "Extended Wait" : "Loading"}
              </span>
              {elapsed >= 30 && <span className="pulse-dot"></span>}
            </div>

            <div className="loader-animation-container">
              <div className="global-loader-spinner" />
              {elapsed >= 30 && <div className="spinner-glow-ring" />}
            </div>

            <div className="loader-text-group">
              <h3 className="global-loader-text">{titleText}</h3>
              <p className="global-loader-subtext">{descText}</p>
            </div>

            <div className="milestones-container">
              <div className="milestone-item done">
                <span className="milestone-status">{getStageIcon(1)}</span>
                <span className="milestone-label">Request sent</span>
              </div>
              <div className={`milestone-item ${elapsed >= 10 ? "done" : "active"}`}>
                <span className="milestone-status">{getStageIcon(2)}</span>
                <span className="milestone-label">Response pending</span>
              </div>
              <div className={`milestone-item ${elapsed >= 30 ? "done" : elapsed >= 10 ? "active" : ""}`}>
                <span className="milestone-status">{getStageIcon(3)}</span>
                <span className="milestone-label">Extended wait detected</span>
              </div>
              <div className={`milestone-item ${elapsed >= 60 ? "done" : elapsed >= 30 ? "active" : ""}`}>
                <span className="milestone-status">{getStageIcon(4)}</span>
                <span className="milestone-label">Still processing</span>
              </div>
              <div className={`milestone-item ${elapsed >= 60 ? "active" : ""}`}>
                <span className="milestone-status">{getStageIcon(5)}</span>
                <span className="milestone-label">Awaiting completion</span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-track">
                <div 
                  className={`progress-fill ${elapsed >= 30 ? "progress-cold" : ""}`} 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="progress-labels">
                <span>Progress: {progressPercent}%</span>
              </div>
            </div>

            <div className="tips-carousel-card">
              <div className="tips-category-badge">{TIPS[tipIndex].category}</div>
              <p className="tips-text">"{TIPS[tipIndex].text}"</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (showCompact) {
    let progressPercent = Math.min(95, Math.round((elapsed / 8) * 100));
    return (
      <>
        {renderToasts()}
        <div className="v-compact-progress-card">
          <div className="v-compact-progress-spinner" />
          <div className="v-compact-progress-info">
            <span className="v-compact-progress-title">{titleText}</span>
            <span className="v-compact-progress-percent">{progressPercent}%</span>
          </div>
        </div>
      </>
    );
  }

  return renderToasts();
};

export default GlobalLoader;
