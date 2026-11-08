import React from "react";
import { createRoot } from "react-dom/client";
import ResumePreview from "../../src/components/ResumePreview.jsx";

async function renderFixture() {
  const host = document.getElementById("fixture-root");
  try {
    const response = await fetch("./synthetic-extracted-resume.json");
    if (!response.ok) throw new Error("Synthetic structured fixture is missing.");
    const resume = await response.json();
    resume.template = "harvard_ats";
    createRoot(host).render(<ResumePreview resume={resume} isFreePlan={false} paginationMode="flow" />);
  } catch (error) {
    host.textContent = error.message;
  }
}

renderFixture();
