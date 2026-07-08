import fs from 'fs';
import path from 'path';
import { CONFIG } from './config.js';

/**
 * Captures a screenshot of the `#resume-preview` container
 */
export async function capturePreview(page, outputPath) {
  const element = await page.$('#resume-preview');
  if (!element) {
    throw new Error('Could not find #resume-preview container on page');
  }
  
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  await element.screenshot({ path: outputPath });
}

/**
 * Converts the exported PDF into PNG pages using PDF.js inside the browser page
 */
export async function convertPdfToPng(page, pdfPath, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBytes.toString('base64');

  // Load blank page to inject pdf.js
  await page.goto('about:blank');
  
  // Inject PDF.js scripts
  await page.evaluate((pdfJsUrl) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = pdfJsUrl;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }, CONFIG.pdfJsUrl);

  const pngPaths = await page.evaluate(async ({ base64Data, pdfWorkerUrl }) => {
    // Set worker
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    
    // Convert base64 back to Uint8Array
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Load PDF Document
    const loadingTask = window.pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    
    const pagesData = [];
    
    // Process pages sequentially
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // High-fidelity scale
      
      const canvas = document.createElement('canvas');
      canvas.id = `pdf-page-${pageNum}`;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      document.body.appendChild(canvas);
      
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;
      
      // Get base64 representation of this rendered canvas
      pagesData.push({
        pageNum,
        dataUrl: canvas.toDataURL('image/png')
      });
      
      canvas.remove();
    }
    
    return pagesData;
  }, { base64Data: pdfBase64, pdfWorkerUrl: CONFIG.pdfJsWorkerUrl });

  const generatedPngs = [];
  
  // Write PNG data URLs back to output disk path
  for (const pageInfo of pngPaths) {
    const filePath = path.join(outputDir, `pdf_page_${pageInfo.pageNum}.png`);
    const data = pageInfo.dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(filePath, data, 'base64');
    generatedPngs.push(filePath);
  }

  return generatedPngs;
}
