import fs from 'fs';
import path from 'path';

/**
 * Exports a PDF of the current page using Playwright's print API
 */
export async function exportPdf(page, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Emulate print media queries
  await page.emulateMedia({ media: 'print' });
  
  // Wait for font rendering and document load
  await page.evaluateHandle('document.fonts.ready');
  await page.waitForTimeout(500);

  // Print PDF with settings aligned to backend pdf-generator.js
  await page.pdf({
    path: outputPath,
    format: 'letter',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: false,
    margin: {
      top: '0px',
      bottom: '45px',
      left: '0px',
      right: '0px'
    }
  });

  // Re-emulate screen
  await page.emulateMedia({ media: 'screen' });
}
