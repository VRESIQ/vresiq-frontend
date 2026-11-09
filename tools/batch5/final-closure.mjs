/**
 * Final conditional-acceptance closure — real browser, real backend, real MongoDB.
 * No API stubbing. Response interception is used only to inject a deliberate save failure.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const backendRequire = createRequire(path.resolve(root, "../vresiq-backend/package.json"));
const puppeteer = backendRequire("puppeteer");
const PORT = process.env.VRESIQ_PORT || "5182";
const BASE = `http://127.0.0.1:${PORT}`;
const EMAIL = process.env.VRESIQ_VERIFY_EMAIL;
const PASSWORD = process.env.VRESIQ_VERIFY_PASSWORD;
const RESUME_ID = process.env.VRESIQ_RESUME_ID;
const OUT = path.resolve(root, "tools/batch5/out");
fs.mkdirSync(OUT, { recursive: true });

const RESULT = { base: BASE, resumeId: RESUME_ID, steps: {}, errors: [], puts: [] };
const log = (k, v) => { RESULT.steps[k] = v; console.log(k + ":", JSON.stringify(v)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"], defaultViewport: { width: 1500, height: 1000 } });
const page = await browser.newPage();
page.on("pageerror", (e) => RESULT.errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") RESULT.errors.push("console: " + m.text().slice(0, 200)); });
page.on("response", (r) => { if (r.url().includes("/api/") && r.status() >= 400) RESULT.errors.push(`http ${r.status()} ${new URL(r.url()).pathname}`); });
page.on("request", (r) => { if (r.method() === "PUT" && r.url().includes("/api/resumes/")) RESULT.puts.push(new Date().toISOString()); });

const toastText = () => page.evaluate(() => Array.from(document.querySelectorAll("[class*=toast], [role=status], .Toastify__toast"))
  .map((el) => (el.textContent || "").trim()).filter(Boolean).join(" | "));

async function clickByText(text, selector = "button, a, li, [role=button], .section-item, .sidebar-item, div") {
  const ok = await page.evaluate(({ text, selector }) => {
    const nodes = Array.from(document.querySelectorAll(selector));
    const exact = nodes.filter((n) => (n.textContent || "").trim() === text && n.offsetParent !== null);
    const target = exact[0];
    if (!target) return false;
    target.scrollIntoView({ block: "center" });
    target.click();
    return true;
  }, { text, selector });
  if (!ok) throw new Error("clickByText failed: " + text);
  await sleep(350);
}

async function setInput(placeholder, value) {
  const sel = `input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`;
  await page.waitForSelector(sel, { timeout: 15000 });
  await page.click(sel, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(sel, value);
}

const val = (placeholder) => page.evaluate((p) => {
  const el = document.querySelector(`input[placeholder="${p}"], textarea[placeholder="${p}"]`);
  return el ? el.value : null;
}, placeholder);

try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => location.pathname === "/dashboard", { timeout: 20000 });
  log("login", { path: await page.evaluate(() => location.pathname), token: await page.evaluate(() => !!sessionStorage.getItem("token")) });

  // --- Dashboard upgrade-notification state for this account -----------------
  log("dashboard", await page.evaluate(() => ({
    upgradeStrip: !!document.querySelector(".upgrade-strip"),
    bodyText: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 260),
  })));

  await page.goto(`${BASE}/resume/${RESUME_ID}/edit`, { waitUntil: "networkidle2" });
  await page.waitForSelector('input[placeholder="John Doe"]', { timeout: 25000 });
  await sleep(1200);

  const before = {
    fullName: await val("John Doe"),
    designation: await val("Software Engineer"),
    portrait: await page.evaluate(() => document.querySelectorAll('img[src^="data:image/"]').length),
  };
  log("loadedBefore", before);

  // --- Edit several fields across sections -----------------------------------
  const stamp = "Abhilash Bonagoni";
  await setInput("John Doe", stamp);
  await setInput("Software Engineer", "Software Developer Analyst");
  await clickByText("Experience");
  await setInput("Google", "IQVIA India");
  if (await page.$('textarea[placeholder^="Frontend developer"]')) {
    await page.click('textarea[placeholder^="Frontend developer"]');
    await page.type('textarea[placeholder^="Frontend developer"]', " Verified autosave sentence.");
  }

  async function ensureSection(name) {
    await clickByText("Section Layout");
    await page.evaluate((n) => {
      const btn = Array.from(document.querySelectorAll("button"))
        .find((el) => (el.textContent || "").replace(/\s+/g, "").startsWith(n + "+Add"));
      if (btn) btn.click();
    }, name);
    await sleep(600);
    await clickByText(name);
    const added = await page.evaluate((n) => {
      const btn = Array.from(document.querySelectorAll("button"))
        .find((el) => (el.textContent || "").trim() === "+ Add " + n);
      if (btn) { btn.click(); return true; }
      return false;
    }, name);
    await sleep(500);
    return { section: name, addedItem: added };
  }

  log("trainingSection", await ensureSection("Training"));
  await setInput("e.g. Advanced Java Programming", "Power BI Data Modelling");
  await setInput("e.g. NPTEL", "Microsoft Learn");
  await setInput("e.g. January 2026 - March 2026", "Feb 2026 - Mar 2026");

  log("internshipSection", await ensureSection("Internships"));
  await setInput("e.g. Software Engineering Intern", "Data Analytics Intern");
  const urlPlaceholder = "e.g. https://company.com/internships or certificate link";
  const hasUrlField = await page.$(`input[placeholder="${urlPlaceholder}"]`);
  if (hasUrlField) {
    await setInput(urlPlaceholder, "https://example.test/internship-certificate");
  }
  const urlLabelPresent = await page.evaluate(() => document.body.innerText.includes("Relevant URL (optional)"));

  const putsBeforeWait = RESULT.puts.length;
  await page.waitForFunction(() => /Changes Saved/i.test(document.body.innerText), { timeout: 15000 }).catch(() => {});
  await sleep(2300);
  log("autosave", {
    putsDuringEdits: RESULT.puts.length - putsBeforeWait,
    toast: await toastText(),
    urlFieldPresent: !!hasUrlField,
    urlLabelPresent,
  });

  const savedAt = RESULT.puts.length;
  // --- Reload and reopen the same resume -------------------------------------
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector('input[placeholder="John Doe"]', { timeout: 25000 });
  await sleep(1200);
  const afterReload = {
    fullName: await val("John Doe"),
    designation: await val("Software Engineer"),
    phone: await val("+91 9876543210"),
    portrait: await page.evaluate(() => document.querySelectorAll('img[src^="data:image/"]').length),
    putsOnLoad: RESULT.puts.length - savedAt,
    trainingItems: await page.evaluate(() => document.body.innerText.split("Training / Course Name").length - 1),
    internshipUrlField: await page.evaluate(() => !!document.querySelector('input[placeholder="e.g. https://company.com/internships or certificate link"]')),
  };
  log("afterReload", afterReload);

  await clickByText("Training");
  const trainingReloaded = {
    title: await val("e.g. Advanced Java Programming"),
    provider: await val("e.g. NPTEL"),
    dates: await val("e.g. January 2026 - March 2026"),
  };
  await clickByText("Internships");
  const internshipReloaded = {
    role: await val("e.g. Software Engineering Intern"),
    url: hasUrlField ? await val(urlPlaceholder) : null,
  };
  log("trainingAfterReload", trainingReloaded);
  log("internshipAfterReload", internshipReloaded);

  // --- Second reload: no duplicate writes or duplicate items -----------------
  const putsBeforeIdleReload = RESULT.puts.length;
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector('input[placeholder="John Doe"]', { timeout: 25000 });
  await sleep(2500);
  log("idleReload", {
    extraPuts: RESULT.puts.length - putsBeforeIdleReload,
    fullName: await val("John Doe"),
    trainingItems: await page.evaluate(() => document.body.innerText.split("Training / Course Name").length - 1),
  });

  // --- Deliberate save failure -> visible error, nothing silently lost -------
  await page.setRequestInterception(true);
  const abort = (req) => {
    if (req.method() === "PUT" && req.url().includes("/api/resumes/")) return req.abort("failed");
    return req.continue();
  };
  page.on("request", abort);
  await setInput("John Doe", "Unsaved Failure Probe");
  await sleep(2600);
  const failureToast = await toastText();
  const failureInline = await page.evaluate(() => (document.body.innerText.match(/Could not auto-save changes\.?/i) || [])[0] || null);
  log("saveFailure", { toast: failureToast, inline: failureInline });
  page.off("request", abort);
  await page.setRequestInterception(false);

  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector('input[placeholder="John Doe"]', { timeout: 25000 });
  await sleep(1000);
  log("afterFailedSaveReload", { fullName: await val("John Doe") });

  // --- Theme regression: light neutral + dark unchanged ----------------------
  const themeOf = () => page.evaluate(() => {
    const cs = getComputedStyle(document.body);
    const shell = document.querySelector(".app-shell, .dashboard, main");
    return {
      attr: document.documentElement.getAttribute("data-theme"),
      bodyBg: cs.backgroundColor,
      bodyColor: cs.color,
      shellBg: shell ? getComputedStyle(shell).backgroundColor : null,
    };
  });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2" });
  await page.waitForSelector("#theme-toggle", { timeout: 15000 });
  const darkTheme = await themeOf();
  await page.click("#theme-toggle");
  await sleep(500);
  const lightTheme = await themeOf();
  await page.screenshot({ path: path.join(OUT, "closure-light-theme.png") });
  await page.click("#theme-toggle");
  await sleep(500);
  const darkAgain = await themeOf();
  log("themes", { darkTheme, lightTheme, darkAgain });
} catch (err) {
  RESULT.fatal = String(err && err.stack ? err.stack : err);
  console.error("FATAL", RESULT.fatal);
} finally {
  RESULT.errors = RESULT.errors.filter((e) => !e.includes("409") && !e.includes("favicon"));
  fs.writeFileSync(path.join(OUT, "final-closure-result.json"), JSON.stringify(RESULT, null, 2));
  console.log("errors:", JSON.stringify(RESULT.errors));
  await browser.close();
}
