import { useState } from "react";
import { refineResume } from "../api";
import "./AiRefinePanel.css";

/**
 * AiRefinePanel — ATS score ring + grouped suggestions panel.
 *
 * Props:
 *   resumeId {string} — the ID of the resume being edited
 *
 * HOW IT WORKS:
 *   1. User clicks "Run ATS Check" — fires POST /api/ai/refine/{resumeId}
 *   2. Backend (RefineService.java) runs strict rule checks across every
 *      builder section, field, template, and ATS-relevant decorative option.
 *   3. Returns { atsScore, overallFeedback, category, issues }
 *   4. We render an animated SVG ring + scrollable issue list.
 *
 * This is a Pro-only feature — the button is only rendered when
 * isFreePlan === false (handled by the parent, ResumeEditor).
 */
const CIRCUMFERENCE = 2 * Math.PI * 34; // radius = 34 (inside 80px svg)

/** Choose ring stroke colour by score */
function ringColor(score) {
  if (score >= 80) return "#b8ff2c"; // lime — great
  if (score >= 55) return "#f0a500"; // amber — needs work
  return "#ba2b2b";                  // red — critical
}

/** Animated SVG score ring */
const ScoreRing = ({ score }) => {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  const color  = ringColor(score);
  return (
    <div className="score-ring-wrap">
      <svg className="score-ring-svg" viewBox="0 0 80 80">
        <circle
          className="score-ring-track"
          cx="40" cy="40" r="34"
        />
        <circle
          className="score-ring-fill"
          cx="40" cy="40" r="34"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          stroke={color}
        />
      </svg>
      <div className="score-ring-label" style={{ color }}>
        {score}
      </div>
    </div>
  );
};

/** One issue row */
const IssueCard = ({ issue }) => (
  <div className={`refine-issue severity-${issue.severity}`}>
    <div className="issue-header">
      <span className={`issue-badge ${issue.severity}`}>
        {issue.severity === "error"   ? "Error"
        : issue.severity === "warning" ? "Warning"
        :                               "Tip"}
      </span>
      {Number(issue.points) > 0 && (
        <span className="issue-points">-{issue.points} pts</span>
      )}
      <span className="issue-section">{issue.section}</span>
    </div>
    <p className="issue-suggestion">{issue.suggestion}</p>
    {issue.original && issue.original.trim() && (
      <p className="issue-original">"{issue.original}"</p>
    )}
  </div>
);

const AiRefinePanel = ({ resumeId, onResult }) => {
  const [status,   setStatus]   = useState("idle"); // idle | loading | done | error
  const [result,   setResult]   = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const runRefine = async () => {
    setStatus("loading");
    setErrorMsg("");
    setResult(null);
    try {
      const res = await refineResume(resumeId);
      setResult(res.data);
      if (typeof onResult === "function") onResult(res.data);
      setStatus("done");
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.error ||
        data?.errors ||
        data?.message ||
        err.message ||
        "Could not run ATS check. Make sure the resume is saved and try again.";
      setErrorMsg(String(msg));
      setStatus("error");
    }
  };

  return (
    <div className="refine-panel">

      {/* Run button + description */}
      <div className="refine-trigger">
        <p>
          Analyse your resume against strict ATS rules: required fields, section
          completeness, dates, metrics, keywords, URLs, and parser-friendly layout.
          Save first for the freshest results.
        </p>
        <button
          className="btn-refine"
          onClick={runRefine}
          disabled={status === "loading"}
          id="btn-ats-refine"
        >
          {status === "loading" ? "Checking…" : "Run ATS Check"}
        </button>
      </div>

      {/* Loading spinner */}
      {status === "loading" && (
        <div className="refine-loading">
          <span className="refine-spinner" />
          Analysing your resume…
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <p className="refine-error">{errorMsg}</p>
      )}

      {/* Results */}
      {status === "done" && result && (
        <>
          {/* Score ring + overall feedback */}
          <div className="refine-score-block">
            <ScoreRing score={result.atsScore} />
            <div className="score-ring-meta">
              <strong>ATS Score: {result.atsScore} / 100</strong>
              <span>{result.overallFeedback}</span>
              {result.category && (
                <div className="refine-category">
                  Detected role: {result.category}
                </div>
              )}
            </div>
          </div>

          {/* Issue list */}
          {result.issues && result.issues.length > 0 ? (
            <div>
              <p className="refine-issues-label">
                {result.issues.length} issue{result.issues.length !== 1 ? "s" : ""} found
              </p>
              <div className="refine-issues">
                {result.issues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} />
                ))}
              </div>
            </div>
          ) : (
            <div className="refine-clean">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#648c00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.5rem" }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              No issues found — your resume looks solid!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AiRefinePanel;
