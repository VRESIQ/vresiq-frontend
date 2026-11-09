/**
 * Batch 5 independent verification — real stack, no API stubs.
 * Drives the actual Vite app against the running Spring Boot backend and MongoDB.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const backendRequire = createRequire(path.resolve(root, "../vresiq-backend/package.json"));
const puppeteer = backendRequire("puppeteer");
const PORT = process.env.VRESIQ_PORT || "5182";
const BASE = `http://127.0.0.1:${PORT}`;
const EMAIL = process.env.VRESIQ_VERIFY_EMAIL;
const PASSWORD = process.env.VRESIQ_VERIFY_PASSWORD;
const PDF = path.resolve(root, "../vresiq-backend/test-fixtures/canada-tester.pdf");
const OUT = path.join(os.tmpdir(), "vresiq-b5-verify");
const RESULT = { base: BASE, steps: {}, errors: [] };
const log = (key, value) => { RESULT.steps[key] = value; console.log(key + ":", JSON.stringify(value)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"], defaultViewport: { width: 1500, height: 1050 } });
const page = await browser.newPage();
page.on("pageerror", (e) => RESULT.errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") RESULT.errors.push("console: " + m.text().slice(0, 200)); });
page.on("response", (r) => {
  if (r.url().includes("/api/") && r.status() >= 400) RESULT.errors.push(`http ${r.status()} ${new URL(r.url()).pathname}`);
});

const cdp = await page.createCDPSession();
await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: OUT });

async function clickText(selector, text) {
  const handles = await page.$$(selector);
  for (const h of handles) {
    const label = (await h.evaluate((el) => el.textContent || "")).trim();
    if (label.includes(text)) { await h.click(); return true; }
  }
  return false;
}

try {
  // 1. Real login through the login form.
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === "/dashboard", { timeout: 20000 });
  const session = await page.evaluate(() => ({ token: !!sessionStorage.getItem("token"), path: location.pathname }));
  log("login", session);

  // 2. Real upload through the Studio file input.
  await page.goto(`${BASE}/admin/reconstruct`, { waitUntil: "networkidle2" });
  const input = await page.waitForSelector('input[type="file"][accept*=".pdf"]', { timeout: 20000 });
  await input.uploadFile(PDF);
  await page.waitForSelector('[data-field="profileInfo.fullName"]', { timeout: 120000 });
  await sleep(800);
  log("upload", await page.evaluate(() => {
    const img = document.querySelector("img.studio-portrait-thumb");
    const name = document.querySelector('[data-field="profileInfo.fullName"]')?.value || "";
    const experiences = document.querySelectorAll('[data-field^="workExperience["]').length;
    return {
      portrait: !!img && img.src.startsWith("data:image/png"),
      portraitChars: img ? img.src.length : 0,
      hasName: name.trim().length > 0,
      experienceInputs: experiences,
      warnings: Array.from(document.querySelectorAll(".studio-warning, .warning-item, li")).map((n) => n.textContent).filter((t) => t && t.includes("portrait")).slice(0, 1),
    };
  }));

  // 3. Real ATS call from the ATS tab.
  await clickText("button", "ATS Report");
  await sleep(400);
  await clickText("button", "Run ATS analysis");
  await page.waitForSelector(".ats-score-value", { timeout: 60000 });
  await sleep(500);
  const report = await page.evaluate(() => ({
    draftScore: document.querySelector(".ats-score-value")?.textContent?.trim(),
    draftFindings: document.querySelectorAll(".ats-sev-error, .ats-sev-warning, .ats-sev-tip").length,
    hasSourceBlock: document.body.innerText.includes("Uploaded file report"),
    sourceFindings: document.body.innerText.includes("Uploaded file report"),
    // find the section-level finding and its jump button
    jumpTargets: Array.from(document.querySelectorAll(".ats-finding")).map((n) => ({
      severity: n.className,
      section: n.querySelector(".ats-finding-head")?.textContent?.trim(),
      hasJump: !!Array.from(n.querySelectorAll("button")).find((b) => b.textContent.includes("Open this field")),
    })),
  }));
  log("atsReport", report);

  // 4. Jump from a section-level finding (workExperience) and from a granular one.
  const jump = await page.evaluate(async () => {
    const findings = Array.from(document.querySelectorAll(".ats-finding"));
    const sectionLevel = findings.find((n) => n.textContent.includes("company or organization"));
    const btn = sectionLevel && Array.from(sectionLevel.querySelectorAll("button")).find((b) => b.textContent.includes("Open this field"));
    if (!btn) return { ran: false };
    btn.click();
    await new Promise((r) => setTimeout(r, 400));
    const active = document.activeElement;
    return {
      ran: true,
      editorTabActive: !!document.querySelector('[data-field="profileInfo.fullName"]'),
      focusedField: active ? active.getAttribute("data-field") : null,
      focusedTag: active ? active.tagName : null,
      scrolledToSection: !!document.querySelector('[data-field="workExperience"]'),
    };
  });
  log("fieldJumpSectionLevel", jump);

  // 5. Real tailoring call with evidenced keywords.
  await clickText("button", "Tailor to Job");
  await sleep(400);
  const jd = "Data Analyst. Required: SQL, Python. Preferred: Power BI";
  await page.click('[data-field="jobDescription"]');
  await page.type('[data-field="jobDescription"]', jd);
  await clickText("button", "Compare with this job");
  await page.waitForSelector(".ats-keyword-grid", { timeout: 60000 });
  await sleep(600);
  const tailor = await page.evaluate(() => ({
    summary: document.querySelector(".ats-tailor-summary, .ats-finding-reco")?.textContent?.trim()?.slice(0, 160),
    chips: Array.from(document.querySelectorAll(".ats-keyword")).map((b) => ({ k: b.textContent.trim(), state: b.className.includes("present") ? "present" : "missing" })),
    unsupported: document.querySelector(".ats-unsupported")?.innerText?.replace(/\s+/g, " ").slice(0, 200) || null,
    suggestions: Array.from(document.querySelectorAll(".ats-suggestion")).map((n) => ({
      type: n.querySelector(".ats-type-badge")?.textContent,
      section: n.querySelector("strong")?.textContent,
      proposal: n.querySelector(".ats-suggestion-proposal")?.textContent?.slice(0, 120),
      evidence: n.querySelector(".ats-finding-original")?.textContent?.slice(0, 100),
      confirm: n.textContent.includes("confirm first"),
    })),
  }));
  log("tailor", tailor);

  // 6. Accept a suggestion, then undo, then dismiss another.
  const applied = await page.evaluate(async () => {
    const s = document.querySelector(".ats-suggestion");
    if (!s) return { ran: false };
    const apply = Array.from(s.querySelectorAll("button")).find((b) => /apply/i.test(b.textContent));
    if (!apply) return { ran: false };
    apply.click();
    await new Promise((r) => setTimeout(r, 500));
    const logText = document.querySelector(".studio-change-log")?.textContent?.trim() || "";
    return { ran: true, log: logText };
  });
  log("applySuggestion", applied);

  const undone = await page.evaluate(async () => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Undo last change"));
    if (!btn || btn.disabled) return { ran: false };
    btn.click();
    await new Promise((r) => setTimeout(r, 400));
    return { ran: true, log: document.querySelector(".studio-change-log")?.textContent?.trim() || null };
  });
  log("undoSuggestion", undone);

  const dismissed = await page.evaluate(async () => {
    const s = document.querySelector(".ats-suggestion");
    if (!s) return { ran: false };
    const before = document.querySelectorAll(".ats-suggestion").length;
    const dismiss = Array.from(s.querySelectorAll("button")).find((b) => /dismiss/i.test(b.textContent));
    if (!dismiss) return { ran: false };
    dismiss.click();
    await new Promise((r) => setTimeout(r, 400));
    return { ran: true, before, after: document.querySelectorAll(".ats-suggestion").length };
  });
  log("dismissSuggestion", dismissed);

  // 7. Portrait remove then upload from canvas (no personal image written to disk).
  // The portrait block lives in the Form Editor tab, which tailoring switched away from.
  await page.evaluate(async () => {
    const tab = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "Form Editor");
    if (tab) tab.click();
    await new Promise((r) => setTimeout(r, 400));
  });
  const portrait = await page.evaluate(async () => {
    const before = !!document.querySelector("img.studio-portrait-thumb");
    const remove = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "Remove");
    if (remove) remove.click();
    await new Promise((r) => setTimeout(r, 300));
    const afterRemove = !!document.querySelector("img.studio-portrait-thumb");
    return { before, afterRemove };
  });
  const canvasData = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 200; c.height = 260;
    const g = c.getContext("2d");
    g.fillStyle = "#2a4a6b"; g.fillRect(0, 0, 200, 260);
    g.fillStyle = "#ffffff"; g.font = "22px sans-serif"; g.fillText("TEST", 68, 136);
    return c.toDataURL("image/png");
  });
  const afterUpload = await page.evaluate(async (dataUrl) => {
    const input = document.querySelector('input[type="file"][accept*="image/png"]');
    const blob = await (await fetch(dataUrl)).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], "portrait.png", { type: "image/png" }));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 600));
    const img = document.querySelector("img.studio-portrait-thumb");
    return { rendered: !!img, prefix: img ? img.src.slice(0, 22) : null };
  }, canvasData);
  log("portrait", { ...portrait, afterUpload });

  // 8. JSON export from the real draft.
  const beforeFiles = new Set(fs.readdirSync(OUT));
  await clickText("button", "Export JSON");
  let file = null;
  for (let i = 0; i < 40 && !file; i++) {
    await sleep(250);
    const now = fs.readdirSync(OUT).filter((f) => f.endsWith(".json") && !beforeFiles.has(f));
    if (now.length) file = path.join(OUT, now[0]);
  }
  if (file) {
    const exported = JSON.parse(fs.readFileSync(file, "utf8"));
    log("jsonExport", {
      keys: Object.keys(exported),
      hasResume: !!exported.resume,
      hasAccount: ["userId", "email", "password", "token"].filter((k) => k in exported),
      portraitChars: (exported.resume?.profileInfo?.profilePreviewUrl || exported.resume?.profileInfo?.ProfilePreviewUrl || "").length,
    });
  } else {
    log("jsonExport", { error: "no download observed" });
  }

  // 9. Persistence through the real editor: open saved resume, edit, autosave, reload.
  const resumeId = process.env.VRESIQ_RESUME_ID;
  if (resumeId) {
    await page.goto(`${BASE}/resume/${resumeId}/edit`, { waitUntil: "networkidle2" });
    await sleep(1500);
    // ResumeEditor renders labelled Field inputs, not data-field attributes.
    const field = await page.evaluateHandle(() => {
      const label = Array.from(document.querySelectorAll("label")).find((l) => l.textContent.trim() === "Designation");
      return label ? label.parentElement.querySelector("input") : null;
    });
    const fieldEl = field.asElement();
    let editor = { loaded: !!fieldEl };
    if (fieldEl) {
      await fieldEl.click({ clickCount: 3 });
      await page.keyboard.type("QA Persistence Check");
      await sleep(3500);
      const saved = await page.evaluate(() => document.body.innerText.includes("Saved") || !!document.querySelector(".save-status"));
      await page.reload({ waitUntil: "networkidle2" });
      await sleep(1500);
      editor = {
        ...editor,
        saveIndicator: saved,
        persistedValue: await page.evaluate(() => {
          const label = Array.from(document.querySelectorAll("label")).find((l) => l.textContent.trim() === "Designation");
          return label ? label.parentElement.querySelector("input")?.value || null : null;
        }),
        previewPortrait: await page.evaluate(() => {
          const img = document.querySelector('#resume-preview img');
          return img ? img.src.slice(0, 22) : null;
        }),
      };
    }
    log("persistence", editor);
  }

  log("pageErrors", RESULT.errors.filter((e) => !e.includes("favicon")));
} catch (error) {
  RESULT.failure = String(error && error.stack ? error.stack.split("\n").slice(0, 4).join(" | ") : error);
  RESULT.pageErrors = RESULT.errors;
  console.log(JSON.stringify(RESULT, null, 2));
} finally {
  await browser.close();
  fs.writeFileSync(path.join(process.env.VRESIQ_EVIDENCE_DIR || ".", "real-e2e-result.json"), JSON.stringify(RESULT, null, 2));
}
