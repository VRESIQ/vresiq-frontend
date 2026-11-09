/**
 * Studio smoke test: verifies the new ATS Report / Tailor tabs, field navigation,
 * portrait control, approve + undo, and JSON export against stubbed APIs.
 *
 * The backend and an admin login are not available locally, so /api/* is stubbed.
 * This validates UI wiring only - not extraction, scoring or persistence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const backendRequire = createRequire(path.resolve(root, "../vresiq-backend/package.json"));
const puppeteer = backendRequire("puppeteer");

const port = process.env.VRESIQ_PORT || "5182";
const out = path.join(dir, "out");
fs.mkdirSync(out, { recursive: true });

const resume = JSON.parse(fs.readFileSync(
  path.join(root, "tools/reconstruction-quality/canada-tester-evidence/canada-extracted-resume.json"),
  "utf8"
));

const uploadResponse = {
  schemaVersion: 2,
  profile: "PROFESSIONAL",
  totalDurationMs: 1800,
  resume,
  detectedRole: "Software Developer Analyst",
  recommendedTemplate: "harvard_ats",
  unclassifiedContent: [],
  warnings: ["A portrait image was found in the uploaded file and attached to the profile."],
  stages: [
    { name: "Document Ingestion", status: "SUCCESS", durationMs: 640, detail: "Extracted text." },
    { name: "Portrait Extraction", status: "SUCCESS", durationMs: 45, detail: "Embedded source image detected." },
    { name: "Deterministic Parsing", status: "SUCCESS", durationMs: 320, detail: "Parsed supported sections." },
  ],
  confidenceReport: { Name: 1.0, Email: 1.0, Experience: 1.0, Education: 1.0, Skills: 0.0 },
  explainabilityRecords: [],
  qualityGates: { requiredSectionsExist: true, contactInfoValid: true, noDuplicateSections: true, atsCompleted: false, passed: true, warnings: [] },
  sourceAtsReport: {
    available: true,
    extractedCharacters: 9603,
    foundSections: 6,
    missingSectionHeadings: ["Skills", "Languages", "Awards", "Interests", "Volunteering", "Internships", "Training"],
    findings: [
      { id: "source_no_links", scope: "source", severity: "tip", section: "Contact", fieldPath: "contactInfo.linkedIn", original: "", message: "No links were found in the file text.", recommendation: "Add at least one link as real text.", check: "source_no_links" },
      { id: "source_page_furniture", scope: "source", severity: "warning", section: "Document structure", fieldPath: "", original: "3", message: "Page numbers or footer text were extracted as resume content.", recommendation: "Remove running headers/footers from the source document.", check: "source_page_furniture" },
    ],
    notes: ["Source analysis reads only the text an ATS parser would receive from the uploaded file."],
    summary: "The file text was readable and 6 standard section heading(s) were recognised.",
  },
};

const analyzeResponse = {
  draft: {
    score: 78,
    readiness: "good",
    category: "software engineer",
    summary: "A solid draft with a few fixable gaps.",
    strengths: ["Clear timeline"],
    findings: [
      { id: "missing_email-0", scope: "draft", severity: "error", section: "Contact > Email", fieldPath: "contactInfo.email", original: "", message: "Add a professional email address.", recommendation: "Add a professional email address.", points: 4, check: "missing_email" },
      { id: "missing_metric-1", scope: "draft", severity: "warning", section: "Experience 1", fieldPath: "workExperience[0].description", original: "Built dashboards.", message: "Add a number or measurable result.", recommendation: "Add a number or measurable result.", points: 3, check: "missing_metric" },
    ],
    keywordCoverage: { total: 0, present: 0, missing: 0, matches: [] },
  },
  tailor: {
    available: true,
    detectedRole: "Senior Frontend Engineer",
    requiredKeywords: [
      { keyword: "react", importance: "required", present: true, evidence: "Built a React design system used by four product teams.", fieldPath: "workExperience[0].description" },
      { keyword: "kubernetes", importance: "required", present: false, evidence: "", fieldPath: "" },
    ],
    preferredKeywords: [
      { keyword: "graphql", importance: "preferred", present: false, evidence: "", fieldPath: "" },
    ],
    suggestions: [
      { id: "kw-0", type: "keyword", section: "Skills", fieldPath: "skills", evidence: "Built a React design system used by four product teams.", proposal: "react", rationale: "This skill appears in your own experience text but is not listed under Skills.", requiresConfirmation: false },
      { id: "sm-1", type: "summary", section: "Summary", fieldPath: "profileInfo.summary", evidence: "react", proposal: "Evidenced strengths: react.", rationale: "Add this sentence only if it accurately represents your work.", requiresConfirmation: true },
    ],
    unsupported: ["kubernetes", "graphql"],
    notes: ["No supporting evidence was found for: kubernetes, graphql."],
    summary: "2 required and 1 preferred keyword(s) recognised; 1/2 required keyword(s) have supporting evidence.",
  },
  durationMs: 42,
  disclaimer: "These checks are deterministic, explainable heuristics.",
};

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  defaultViewport: { width: 1440, height: 1000 },
});

const errors = [];
let result = {};
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.evaluateOnNewDocument(() => sessionStorage.setItem("token", "smoke-token"));

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/")) return request.continue();

    const json = (body) => request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (url.pathname === "/api/auth/profile") {
      return json({ id: "smoke-admin", fullName: "Smoke Admin", email: "smoke@example.com", role: "ADMIN", subscriptionPlan: "premium" });
    }
    if (url.pathname === "/api/admin/reconstruct/upload") return json(uploadResponse);
    if (url.pathname === "/api/admin/reconstruct/analyze") return json(analyzeResponse);
    if (url.pathname === "/api/admin/reconstruct/enhance-bullet") return json({ enhancedText: "Enhanced." });
    return json({});
  });

  await page.goto(`http://127.0.0.1:${port}/admin/reconstruct`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector("input[type=file]", { timeout: 20000 });

  const fileInput = await page.$("input[type=file]");
  await fileInput.uploadFile(path.resolve(root, "../vresiq-backend/test-fixtures/canada-tester.pdf"));
  await page.waitForFunction(() => document.body.innerText.includes("Form Editor"), { timeout: 20000 });

  result.portraitRendered = await page.evaluate(() => {
    const image = document.querySelector(".studio-portrait-thumb");
    return Boolean(image && image.tagName === "IMG" && image.src.startsWith("data:image/"));
  });
  await page.screenshot({ path: path.join(out, "studio-editor.png") });

  // ATS report
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent.trim() === "ATS Report");
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Uploaded file report"), { timeout: 10000 });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent.includes("Run ATS analysis"));
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Draft report"), { timeout: 10000 });
  result.draftScoreShown = await page.evaluate(() => document.querySelector(".ats-score-value")?.textContent || "");
  result.findingCount = await page.evaluate(() => document.querySelectorAll(".ats-finding").length);
  await page.screenshot({ path: path.join(out, "studio-ats-report.png") });

  // Field navigation from a finding
  await page.evaluate(() => {
    const link = [...document.querySelectorAll(".ats-goto")].find((node) => node.textContent.includes("Open this field"));
    link.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 350));
  result.jumpedToField = await page.evaluate(() => {
    const active = document.activeElement;
    return { field: active?.getAttribute("data-field") || "", tab: document.body.innerText.includes("Recruiter Summary") };
  });

  // Tailoring
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent.trim() === "Tailor to Job");
    button.click();
  });
  await page.waitForSelector("textarea[data-field=jobDescription]", { timeout: 10000 });
  await page.type("textarea[data-field=jobDescription]", "Senior Frontend Engineer. Required: React, Kubernetes. Preferred: GraphQL.");
  await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent.includes("Compare with this job"));
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("Proposed changes"), { timeout: 10000 });
  result.keywordChips = await page.evaluate(() => ({
    present: document.querySelectorAll(".ats-keyword.present").length,
    missing: document.querySelectorAll(".ats-keyword.missing").length,
    unsupportedShown: document.body.innerText.includes("kubernetes"),
  }));
  await page.screenshot({ path: path.join(out, "studio-tailor.png") });

  // Apply then undo a keyword suggestion
  await page.evaluate(() => {
    const button = [...document.querySelectorAll(".ats-suggestion-actions button")].find((node) => node.textContent.trim() === "Apply");
    button.click();
  });
  await page.waitForFunction(() => document.body.innerText.includes("approved change"), { timeout: 5000 });
  result.afterApply = await page.evaluate(() => document.querySelector(".studio-change-log")?.textContent || "");
  await page.evaluate(() => {
    const button = [...document.querySelectorAll(".studio-mini-btn")].find((node) => node.textContent.includes("Undo last change"));
    button.click();
  });
  result.afterUndo = await page.evaluate(() => document.querySelectorAll(".studio-change-log").length);

  // JSON export triggers a download with the canonical schema
  const client = await page.target().createCDPSession();
  await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: out });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll(".studio-mini-btn")].find((node) => node.textContent.includes("Export JSON"));
    button.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const downloads = fs.readdirSync(out).filter((name) => name.endsWith(".json"));
  result.jsonExported = downloads.length > 0;
  if (downloads.length) {
    const payload = JSON.parse(fs.readFileSync(path.join(out, downloads[0]), "utf8"));
    result.jsonKeys = Object.keys(payload);
    result.jsonHasResume = Boolean(payload.resume && payload.resume.profileInfo);
    result.jsonHasAccountData = JSON.stringify(payload).includes("smoke-admin");
  }

  result.errors = errors;
} catch (error) {
  result.failure = String(error);
  result.errors = errors;
} finally {
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
