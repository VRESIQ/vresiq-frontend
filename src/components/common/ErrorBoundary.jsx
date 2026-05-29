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
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Something went wrong
            </p>
            <h1 style={{ fontSize: "2.4rem", marginBottom: "0.75rem" }}>
              Page crashed
            </h1>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
              An unexpected error occurred. Your data is safe — go back to the dashboard.
            </p>
            <Link
              to="/dashboard"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                display: "inline-block",
                padding: "0.75rem 1.25rem",
                background: "var(--ink)",
                color: "var(--paper)",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                fontWeight: 680,
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
