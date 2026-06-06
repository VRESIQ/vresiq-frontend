import { useEffect, useState } from "react";
import { loadingService } from "../../utils/loadingService";
import "./GlobalLoader.css";

const GlobalLoader = () => {
  const [requests, setRequests] = useState([]);
  const [elapsed, setElapsed] = useState(0);

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

  if (requests.length === 0) return null;

  // Resolve contextual message based on current active request endpoint
  const primaryReq = requests[0];
  const url = primaryReq.url || "";
  const method = primaryReq.method || "GET";

  let titleText = "Processing your request";
  let descText = "Please wait a moment...";

  // 1. Contextual Mapping
  if (url.includes("/api/auth/profile") && method === "GET") {
    titleText = "Loading your profile...";
    descText = "Usually completes within a few seconds.";
  } else if (url.includes("/api/resumes") && method === "GET") {
    titleText = "Loading your dashboard...";
    descText = "Estimated wait: 5–15 seconds.";
  } else if (url.includes("/api/resumes") && method === "POST") {
    titleText = "Generating resume...";
    descText = "Estimated wait: 20–40 seconds.";
  } else if (url.includes("/api/resumes") && method === "PUT" && url.includes("/export-pdf")) {
    titleText = "Exporting PDF...";
    descText = "Preparing layout, fonts, and export. Estimated wait: 10–20 seconds.";
  } else if (url.includes("/api/resumes") && method === "PUT") {
    titleText = "Saving your changes...";
    descText = "Usually completes within a few seconds.";
  } else if (url.includes("/api/payment/create-order")) {
    titleText = "Connecting to payment gateway...";
    descText = "Processing order details. Estimated wait: 5–15 seconds.";
  } else if (url.includes("/api/payment/verify")) {
    titleText = "Verifying payment...";
    descText = "Please do not refresh the page. Estimated wait: 5–15 seconds.";
  }

  // 2. Slow Operation & Cold Start Interception (Threshold Warnings override standard descriptions)
  if (elapsed >= 60) {
    titleText = "Server is still starting";
    descText = "The server is waking up after inactivity. Estimated wait: 1–2 minutes. This only happens after long periods of inactivity.";
  } else if (elapsed >= 30) {
    titleText = "This is taking longer than usual...";
    descText = "The server might be cold-starting or busy. Please do not close or reload this page.";
  } else if (elapsed >= 10) {
    titleText = "Still working...";
    descText = "Processing your request. Thank you for your patience.";
  }

  return (
    <div className="global-loader-overlay">
      <div className="global-loader-card">
        <div className="global-loader-spinner" />
        <p className="global-loader-text">{titleText}</p>
        <p className="global-loader-subtext">{descText}</p>
        {elapsed > 0 && (
          <small style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: "4px" }}>
            Elapsed: {elapsed}s
          </small>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;
