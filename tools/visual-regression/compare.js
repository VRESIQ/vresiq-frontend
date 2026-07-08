import fs from 'fs';
import path from 'path';

/**
 * Runs visual diffing inside a browser context to compare preview PNG and rendered PDF PNG
 */
export async function compareImages(page, previewPath, pdfPath, diffPath) {
  // Convert images to data URIs
  const previewData = fs.readFileSync(previewPath).toString('base64');
  const pdfData = fs.readFileSync(pdfPath).toString('base64');
  
  const result = await page.evaluate(async ({ previewBase64, pdfBase64 }) => {
    return new Promise((resolve) => {
      const img1 = new Image();
      const img2 = new Image();
      
      let loadedCount = 0;
      const onLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          // Scale both to standard Letter dimensions to align layouts and prevent aspect ratio diffs
          const width = 816;
          const height = 1056;
          
          const canvas1 = document.createElement('canvas');
          const canvas2 = document.createElement('canvas');
          const canvasDiff = document.createElement('canvas');
          
          canvas1.width = width; canvas1.height = height;
          canvas2.width = width; canvas2.height = height;
          canvasDiff.width = width; canvasDiff.height = height;
          
          const ctx1 = canvas1.getContext('2d');
          const ctx2 = canvas2.getContext('2d');
          const ctxDiff = canvasDiff.getContext('2d');
          
          ctx1.drawImage(img1, 0, 0, width, height);
          ctx2.drawImage(img2, 0, 0, width, height);
          
          const imgData1 = ctx1.getImageData(0, 0, width, height);
          const imgData2 = ctx2.getImageData(0, 0, width, height);
          const imgDataDiff = ctxDiff.createImageData(width, height);
          
          let diffPixels = 0;
          const totalPixels = width * height;
          
          for (let i = 0; i < imgData1.data.length; i += 4) {
            const r1 = imgData1.data[i];
            const g1 = imgData1.data[i+1];
            const b1 = imgData1.data[i+2];
            const a1 = imgData1.data[i+3];
            
            const r2 = imgData2.data[i];
            const g2 = imgData2.data[i+1];
            const b2 = imgData2.data[i+2];
            const a2 = imgData2.data[i+3];
            
            // Allow minor tolerance (anti-aliasing)
            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2);
            
            if (diff > 45) { // Threshold limit
              diffPixels++;
              // Highlight diff in bright red/magenta
              imgDataDiff.data[i] = 255;
              imgDataDiff.data[i+1] = 0;
              imgDataDiff.data[i+2] = 128;
              imgDataDiff.data[i+3] = 255;
            } else {
              // Show identical pixels in semi-transparent gray
              const val = Math.floor((r1 + g1 + b1) / 3);
              imgDataDiff.data[i] = val;
              imgDataDiff.data[i+1] = val;
              imgDataDiff.data[i+2] = val;
              imgDataDiff.data[i+3] = 45; // faded overlay
            }
          }
          
          ctxDiff.putImageData(imgDataDiff, 0, 0);
          const diffUrl = canvasDiff.toDataURL('image/png');
          const percentage = (diffPixels / totalPixels) * 100;
          
          resolve({ percentage, diffUrl });
        }
      };
      
      img1.onload = onLoad;
      img2.onload = onLoad;
      
      img1.src = 'data:image/png;base64,' + previewBase64;
      img2.src = 'data:image/png;base64,' + pdfBase64;
    });
  }, { previewBase64: previewData, pdfBase64: pdfData });
  
  // Save diff image
  const base64Data = result.diffUrl.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(diffPath, base64Data, 'base64');
  
  return result.percentage;
}
