import * as Sentry from "@sentry/react";
import { Component } from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          boundary: "resume-editor",
        },
        extra: info,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            textAlign: "center",
            background: "var(--paper)",
            color: "var(--ink)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div style={{ maxWidth: "480px", width: "100%" }}>
            {/* VRESIQ Logo */}
            <div className="nav-logo" style={{ fontSize: "2rem", pointerEvents: "none", textDecoration: "none", marginBottom: "24px", display: "inline-block" }}>
              <span className="logo-v">V</span>
              <span className="logo-res">RES</span>
              <span className="logo-iq">IQ</span>
            </div>

            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
              Something went wrong
            </p>
            <h1 style={{ fontSize: "2.4rem", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
              Page crashed
            </h1>
            <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.95rem", lineHeight: 1.5 }}>
              An unexpected error occurred. Your data is safe — go back to the dashboard or try again.
            </p>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "2rem" }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  display: "inline-block",
                  padding: "0.75rem 1.25rem",
                  background: "var(--ink)",
                  color: "var(--paper)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--ink)",
                  cursor: "pointer",
                  fontWeight: 680,
                  fontSize: "0.9rem",
                  transition: "all 0.16s ease"
                }}
              >
                Retry Page
              </button>
              <Link
                to="/dashboard"
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  display: "inline-block",
                  padding: "0.75rem 1.25rem",
                  background: "transparent",
                  color: "var(--ink)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--line)",
                  textDecoration: "none",
                  fontWeight: 680,
                  fontSize: "0.9rem",
                  transition: "all 0.16s ease"
                }}
              >
                Back to dashboard
              </Link>
            </div>

            {/* Diagnostic Details Panel */}
            <details style={{ marginTop: "20px", textAlign: "left", background: "var(--wash)", border: "1px solid var(--line)", padding: "14px", borderRadius: "10px" }}>
              <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "var(--muted)", fontWeight: 600 }}>
                Show Diagnostics & Details
              </summary>
              <pre style={{ fontSize: "0.75rem", marginTop: "10px", overflowX: "auto", whiteSpace: "pre-wrap", color: "var(--danger)", background: "rgba(186,43,43,0.02)", padding: "8px", borderRadius: "6px", border: "1px solid rgba(186,43,43,0.08)" }}>
                {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
