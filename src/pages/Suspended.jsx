import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import NavLogo from "../components/NavLogo";
import { SUPPORT_EMAIL } from "../constants/config";
import "./Legal.css";
import "./Pricing.css";

const Suspended = () => {
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");
  
  const triggerButtonRef = useRef(null);
  const modalRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const rawSubject = "Suspended Account Assistance";
  const rawBody = (
    "- Name:\n" +
    "- Registered Email:\n" +
    "- Issue: Account Suspension Inquiry\n" +
    "- Additional Details:"
  );

  const triggerToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast("");
      toastTimeoutRef.current = null;
    }, 2000);
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    triggerToast(`${label} copied to clipboard!`);
  };

  const handleCopyAll = () => {
    const combinedText = (
      `To: ${SUPPORT_EMAIL}\n` +
      `Subject: ${rawSubject}\n\n` +
      `Message Body:\n${rawBody}`
    );
    navigator.clipboard.writeText(combinedText);
    triggerToast("All details copied to clipboard!");
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodeURIComponent(rawSubject)}&body=${encodeURIComponent(rawBody)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  // Trapping keyboard focus, closing on Escape, and body scroll prevention
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setShowModal(false);
          return;
        }

        if (e.key === "Tab" && focusableElements) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    } else {
      triggerButtonRef.current?.focus();
    }
  }, [showModal]);

  return (
    <div className="legal-page premium-shell" style={{ position: "relative", minHeight: "100vh" }}>
      <nav className="pricing-nav">
        <NavLogo className="pricing-logo" />
        <div className="pricing-nav-links">
          <Link to="/" className="btn-back">Home</Link>
        </div>
      </nav>

      <div className="legal-content" style={{ marginTop: "10vh" }}>
        <div className="legal-card" style={{ textAlign: "center", borderColor: "rgba(186, 43, 43, 0.4)" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ba2b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          
          <h1 style={{ fontSize: "2rem", color: "#ffffff", marginBottom: "1rem" }}>Account Suspended</h1>
          
          <p style={{ fontSize: "1.1rem", lineHeight: "1.6", color: "#ffffff", opacity: 0.9, marginBottom: "2rem" }}>
            Your account has been temporarily suspended by an administrator.<br />
            Please contact support for assistance.
          </p>

          <button
            type="button"
            ref={triggerButtonRef}
            onClick={() => setShowModal(true)}
            className="btn-create"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              textDecoration: "none",
              backgroundColor: "#ba2b2b",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              marginBottom: "1.8rem"
            }}
          >
            Contact Support
          </button>

          <div
            className="manual-contact-card"
            style={{
              fontSize: "0.92rem",
              lineHeight: "1.5",
              color: "rgba(255, 255, 255, 0.75)",
              padding: "1rem",
              borderRadius: "6px",
              border: "1px dashed rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.02)",
              maxWidth: "320px",
              margin: "0 auto"
            }}
          >
            <span style={{ display: "block", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8, marginBottom: "0.4rem" }}>
              Quick Contact
            </span>
            Email:
            <br />
            <strong style={{ color: "var(--accent, #648c00)", fontSize: "1.05rem" }}>{SUPPORT_EMAIL}</strong>
          </div>
        </div>
      </div>

      {/* In-Browser Support Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          style={{
            display: "grid",
            placeItems: "center",
            position: "fixed",
            inset: 0,
            background: "rgba(8, 10, 8, 0.72)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000,
            padding: "1rem"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="suspended-modal"
            ref={modalRef}
            style={{
              position: "relative",
              background: "linear-gradient(180deg, #23271f 0%, #1d211b 100%)",
              border: "1px solid rgba(180, 255, 80, 0.18)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "calc(100vh - 4rem)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              textAlign: "left",
              boxSizing: "border-box",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top highlight line */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                pointerEvents: "none",
                zIndex: 15
              }}
            />

            {/* Scrollable body */}
            <div style={{ padding: "2.5rem 2.5rem 0.5rem 2.5rem", overflowY: "auto", flex: 1 }}>
              <h2 style={{ fontSize: "1.45rem", color: "#ffffff", marginBottom: "1.2rem" }}>Contact Support</h2>
              <p style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.75)", marginBottom: "1.8rem", lineHeight: "1.4" }}>
                Please copy the details below to email us manually, or use the Gmail button to compose immediately.
              </p>

              {/* Email Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "rgba(180, 255, 80, 0.75)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "0.35rem" }}>Support Email</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    readOnly
                    value={SUPPORT_EMAIL}
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.8rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      borderRadius: "4px",
                      fontSize: "0.9rem"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(SUPPORT_EMAIL, "Email")}
                    style={{
                      padding: "0.6rem 1.2rem",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      fontWeight: "bold",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Subject Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "rgba(180, 255, 80, 0.75)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "0.35rem" }}>Subject</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    readOnly
                    value={rawSubject}
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.8rem",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      borderRadius: "4px",
                      fontSize: "0.9rem"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(rawSubject, "Subject")}
                    style={{
                      padding: "0.6rem 1.2rem",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      fontWeight: "bold",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.85rem"
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Message Body Field */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "rgba(180, 255, 80, 0.75)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "0.35rem" }}>Suggested Message Body</label>
                <textarea
                  readOnly
                  value={rawBody}
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "0.88rem",
                    resize: "none",
                    marginBottom: "0.5rem",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(rawBody, "Message template")}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.88rem"
                  }}
                >
                  Copy Message Body
                </button>
              </div>
            </div>

            {/* Fixed Footer Actions */}
            <div
              style={{
                padding: "1.5rem 2.5rem 2.5rem 2.5rem",
                background: "transparent",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                zIndex: 10
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "rgba(100, 140, 0, 0.15)",
                    border: "1px solid var(--accent, #648c00)",
                    color: "var(--accent, #648c00)",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  Copy All Details
                </button>
                
                <button
                  type="button"
                  onClick={handleOpenGmail}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "var(--accent, #648c00)",
                    border: "none",
                    color: "#000000",
                    fontWeight: "bold",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  Open Gmail
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  marginTop: "0.25rem"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Banner */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--accent, #648c00)",
            color: "#000000",
            padding: "0.6rem 1.5rem",
            borderRadius: "50px",
            fontWeight: "bold",
            fontSize: "0.92rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 2000,
            transition: "all 0.2s ease"
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default Suspended;
