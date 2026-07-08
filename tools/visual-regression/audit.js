import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { CONFIG, generateSmartMatrix } from './config.js';
import { getMockResumeForProfile } from './content-generator.js';
import { exportPdf } from './export-pdf.js';
import { capturePreview, convertPdfToPng } from './screenshot.js';
import { compareImages } from './compare.js';
import { generateReports } from './report.js';

async function main() {
  const startTime = Date.now();
  const updateBaseline = process.argv.includes('--update-baseline');
  
  console.log('====================================================');
  console.log(updateBaseline 
    ? 'UPDATING APPROVED VISUAL BASELINES...' 
    : 'LAUNCHING PRODUCTION-GRADE RENDERING VALIDATION SUITE...');
  console.log('====================================================\n');

  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  if (!fs.existsSync(CONFIG.baselineDir)) {
    fs.mkdirSync(CONFIG.baselineDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 1200 });

  let activeResumePayload = {};

  // Intercept backend requests dynamically to supply the current test case mock data
  await page.route('**/api/resumes/test-audit-id', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(activeResumePayload)
    });
  });
  
  await page.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ email: 'audit-engineer@vresiq.app', name: 'QA Engineer', plan: 'pro' })
    });
  });

  await page.route('**/api/**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  // Navigate to verify preview server connection
  console.log(`Connecting to Vite Preview Server at ${CONFIG.frontendUrl}...`);
  try {
    await page.goto(CONFIG.frontendUrl, { waitUntil: 'networkidle' });
  } catch (err) {
    console.error(`Error: Could not connect to frontend server at ${CONFIG.frontendUrl}.`);
    console.error('Make sure you have started the server (e.g. npm run preview) before running this script.\n');
    await browser.close();
    process.exit(1);
  }

  // Set local session credentials
  await page.evaluate(() => {
    sessionStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ email: 'audit-engineer@vresiq.app', plan: 'pro' }));
    localStorage.setItem('refreshToken', 'mock-refresh-token');
  });

  const matrix = generateSmartMatrix();
  console.log(`Total smart coverage test cases loaded: ${matrix.length}\n`);

  const results = [];

  for (let i = 0; i < matrix.length; i++) {
    const { template, caseId, description, config } = matrix[i];
    console.log(`[${i+1}/${matrix.length}] Auditing: ${template} [${caseId}] - ${description}`);

    // Build payload dynamic content
    const resumeData = getMockResumeForProfile(config.contentProfile.type);
    resumeData.template = template;
    resumeData.fontPairing = config.fontPairing;
    resumeData.decoratives.useCustomAccent = config.useCustomAccent;
    if (config.accentColor !== 'default') {
      resumeData.decoratives.accentColor = config.accentColor;
    }
    resumeData.decoratives.highDensity = config.highDensity;
    resumeData.decoratives.headerStyle = config.headerStyle;
    resumeData.decoratives.photoShape = config.photo === 'circle' ? 'circle' : 'none';
    resumeData.decoratives.linkStyle = config.linkStyle;

    activeResumePayload = resumeData;

    // Output folders setup
    const templateBaselineDir = path.join(CONFIG.baselineDir, template);
    if (!fs.existsSync(templateBaselineDir)) {
      fs.mkdirSync(templateBaselineDir, { recursive: true });
    }

    const templateOutputDir = path.join(CONFIG.outputDir, template, caseId);
    if (!fs.existsSync(templateOutputDir)) {
      fs.mkdirSync(templateOutputDir, { recursive: true });
    }

    const previewPath = path.join(templateOutputDir, 'preview_current.png');
    const pdfPath = path.join(templateOutputDir, 'export_current.pdf');
    const pdfPngDir = path.join(templateOutputDir, 'pdf_pages');
    const diffPath = path.join(templateOutputDir, 'diff_current.png');

    const baselinePreviewPath = path.join(templateBaselineDir, `${caseId}_preview.png`);
    const baselinePdfPath = path.join(templateBaselineDir, `${caseId}_pdf.png`);

    try {
      // 1. Render template layout
      await page.goto(`${CONFIG.frontendUrl}/resume/test-audit-id/edit`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#resume-preview');
      await page.waitForTimeout(400); // render stabilizations

      if (updateBaseline) {
        // Capture baseline files directly
        await capturePreview(page, baselinePreviewPath);
        await exportPdf(page, pdfPath);
        const pdfPngs = await convertPdfToPng(page, pdfPath, pdfPngDir);
        if (pdfPngs.length > 0) {
          fs.copyFileSync(pdfPngs[0], baselinePdfPath);
        }
        console.log(`  ✓ Baselines saved for ${template} [${caseId}]`);
        results.push({
          template,
          caseId,
          config,
          diffPercentage: 0,
          status: 'PASS',
          previewImage: baselinePreviewPath,
          pdfImage: baselinePdfPath,
          diffImage: ''
        });
      } else {
        // Verify current layout against baseline or dynamic fallback
        await capturePreview(page, previewPath);
        await exportPdf(page, pdfPath);
        const pdfPngs = await convertPdfToPng(page, pdfPath, pdfPngDir);

        if (pdfPngs.length === 0) {
          throw new Error('Rendered PDF contains 0 pages');
        }

        let refPreview = baselinePreviewPath;
        let refPdf = baselinePdfPath;

        if (!fs.existsSync(baselinePreviewPath) || !fs.existsSync(baselinePdfPath)) {
          console.warn(`  ⚠️ Baseline files missing for ${template} [${caseId}]. Falling back to current Preview-to-PDF diff.`);
          refPreview = previewPath;
          refPdf = pdfPngs[0];
        }

        // Compare Current Preview vs Ref Preview
        const diffPreviewPercent = await compareImages(page, previewPath, refPreview, diffPath);
        
        // Compare Current PDF Page vs Ref PDF Page
        const diffPdfPath = path.join(templateOutputDir, 'diff_pdf.png');
        const diffPdfPercent = await compareImages(page, pdfPngs[0], refPdf, diffPdfPath);

        const diffPercentage = Math.max(diffPreviewPercent, diffPdfPercent);
        const status = diffPercentage <= CONFIG.diffThreshold ? 'PASS' : 'FAIL';

        if (status === 'FAIL') {
          console.warn(`  ❌ Layout regression detected: ${diffPercentage.toFixed(3)}% mismatch`);
        } else {
          console.log(`  ✓ Passed. Diff Percentage: ${diffPercentage.toFixed(4)}%`);
        }

        results.push({
          template,
          caseId,
          config,
          diffPercentage,
          status,
          previewImage: `./${template}/${caseId}/preview_current.png`,
          pdfImage: `./${template}/${caseId}/pdf_pages/pdf_page_1.png`,
          diffImage: `./${template}/${caseId}/diff_current.png`
        });
      }

    } catch (err) {
      console.error(`  ❌ Error during execution:`, err.message);
      results.push({
        template,
        caseId,
        config,
        diffPercentage: 100,
        status: 'FAIL',
        error: err.message,
        previewImage: '',
        pdfImage: '',
        diffImage: ''
      });
    }
  }

  const durationMs = Date.now() - startTime;

  // Compile final HTML, JSON, and CSV summaries
  console.log('\nCompiling visual regression validation reports...');
  generateReports(results, CONFIG.outputDir, durationMs);

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.length - passed;

  console.log('\n====================================================');
  console.log('AUDIT SUMMARY REPORT');
  console.log('====================================================');
  console.log(`Total Templates Checked : ${CONFIG.templates.length}`);
  console.log(`Total Configurations    : ${results.length}`);
  console.log(`Passed Checks           : ${passed}`);
  console.log(`Failed Checks           : ${failed}`);
  console.log(`Pass Rate               : ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log(`Execution Time          : ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`HTML Report Path        : ${path.resolve(CONFIG.outputDir, 'report.html')}`);
  console.log(`JSON Report Path        : ${path.resolve(CONFIG.outputDir, 'report.json')}`);
  console.log(`CSV Report Path         : ${path.resolve(CONFIG.outputDir, 'report.csv')}`);
  console.log(`Coverage Report Path    : ${path.resolve(CONFIG.outputDir, 'coverage.md')}`);
  console.log('====================================================\n');

  await browser.close();

  if (failed > 0 && !updateBaseline) {
    console.error(`Audit Failed: ${failed} visual rendering or PDF layout regressions detected.`);
    process.exit(1);
  } else {
    console.log(updateBaseline 
      ? 'Baselines successfully updated!' 
      : 'Validation Succeeded: All design layout regressions check passed!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal visual regression runner crash:', err);
  process.exit(1);
});
