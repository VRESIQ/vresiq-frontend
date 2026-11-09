/** Captures the real Studio export payload (post-parser-fix) so both PDF tiers can be generated. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const backendRequire = createRequire(path.resolve(root, "../vresiq-backend/package.json"));
const puppeteer = backendRequire("puppeteer");
const BASE = "http://127.0.0.1:5182";
const PDF = path.resolve(root, "../vresiq-backend/test-fixtures/canada-tester.pdf");
const OUT = path.resolve(root, "tools/batch5/out");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
let body = null;
let token = null;
page.on("request", (req) => {
  if (req.url().includes("/export-pdf") && req.method() === "POST") {
    try { body = JSON.parse(req.postData()); } catch { /* ignore */ }
  }
});

const result = {};
try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', "b5.verify@vresiq.local");
  await page.type('input[type="password"]', "B5verify!2026");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === "/dashboard", { timeout: 20000 });
  token = await page.evaluate(() => sessionStorage.getItem("token"));

  await page.goto(`${BASE}/admin/reconstruct`, { waitUntil: "networkidle2" });
  const input = await page.waitForSelector('input[type="file"][accept*=".pdf"]', { timeout: 20000 });
  await input.uploadFile(PDF);
  await page.waitForSelector('[data-field="profileInfo.fullName"]', { timeout: 120000 });
  await sleep(1500);
  result.employers = await page.evaluate(() => Array.from(document.querySelectorAll('[data-field^="workExperience["]'))
    .map((el) => el.value).filter((v) => v).slice(0, 6));

  const clicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => /Download Reconstructed PDF/i.test(b.textContent || ""));
    if (btn) { btn.click(); return true; }
    return false;
  });
  for (let i = 0; i < 60 && !body; i++) await sleep(250);
  result.exportClicked = clicked;
  result.htmlChars = body?.htmlContent?.length || 0;
  result.isFreePlanSent = body?.isFreePlan ?? null;
  if (body) fs.writeFileSync(path.join(OUT, "final-export-body.json"), JSON.stringify(body));
} catch (e) {
  result.fatal = String(e && e.stack ? e.stack : e);
} finally {
  fs.writeFileSync(path.join(OUT, "final-pdf-capture.json"), JSON.stringify({ ...result, token }, null, 2));
  console.log(JSON.stringify(result));
  await browser.close();
}
