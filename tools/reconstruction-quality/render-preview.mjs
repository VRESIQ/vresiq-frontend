import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const baseDir = path.dirname(fileURLToPath(import.meta.url));
const backendRequire = createRequire(path.resolve(baseDir, "../../../vresiq-backend/tools/pdf-generator.js"));
const puppeteer = backendRequire("puppeteer");
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:5173/tools/reconstruction-quality/render.html", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#resume-preview .rp-section", { timeout: 30000 });
  await page.screenshot({ path: path.join(baseDir, "synthetic-reconstructed-preview.png"), fullPage: true });

  const { html, css, height, warnings, name, nameColor } = await page.evaluate(() => {
    const element = document.getElementById("resume-preview");
    let cssText = "";
    for (const sheet of document.styleSheets) {
      try { cssText += Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join("\n") + "\n"; }
      catch { /* external font/style origins remain linked below when present */ }
    }
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((link) => link.outerHTML).join("\n");
    const warningText = document.querySelectorAll(".rp-section").length + " rendered sections";
    const nameElement = element.querySelector(".rp-ats-name-serif, .rp-ats-name");
    return { html: element.outerHTML, css: `${links}\n<style>${cssText}</style>`, height: element.scrollHeight, warnings: warningText, name: nameElement?.textContent, nameColor: nameElement ? getComputedStyle(nameElement).color : null };
  });

  const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>VResIQ reconstruction evidence</title>${css}<style>html,body{margin:0;padding:0;background:#fff}body *{visibility:visible!important}#resume-preview{position:relative!important;top:auto!important;left:auto!important;min-height:auto!important;height:auto!important;margin:0!important;width:100%!important;max-width:100%!important;overflow:visible!important;box-shadow:none!important}</style></head><body>${html}</body></html>`;
  await fs.writeFile(path.join(baseDir, "synthetic-render-input.html"), documentHtml, "utf8");
  console.log(JSON.stringify({ renderedSections: warnings, previewHeightPx: height, candidateName: name, nameColor, screenshot: "synthetic-reconstructed-preview.png" }));
} finally {
  await browser.close();
}
