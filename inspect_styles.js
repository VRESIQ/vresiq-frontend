import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log("Navigating to http://localhost:5173/test-preview...");
  await page.goto('http://localhost:5173/test-preview');
  
  await page.waitForSelector('.resume-preview');
  
  const borderStyles = await page.evaluate(() => {
    const preview = document.querySelector('.resume-preview');
    
    // Create a temporary test container inside preview
    const testDiv = document.createElement('div');
    preview.appendChild(testDiv);
    
    const getBorderTop = (tpl, hstyle) => {
      // Set hstyle attribute on preview
      preview.setAttribute('data-hstyle', hstyle);
      // Set template class on testDiv
      testDiv.className = `rp-ats-container rp-${tpl}`;
      
      const computed = window.getComputedStyle(testDiv);
      const borderTop = computed.borderTop;
      const borderTopWidth = computed.borderTopWidth;
      const borderTopStyle = computed.borderTopStyle;
      
      return { borderTop, borderTopWidth, borderTopStyle };
    };
    
    const results = {
      classicCard: getBorderTop('ats-classic', 'card'),
      classicMinimal: getBorderTop('ats-classic', 'minimal'),
      classicFullBleed: getBorderTop('ats-classic', 'full-bleed'),
      seniorCard: getBorderTop('ats-senior', 'card'),
      seniorMinimal: getBorderTop('ats-senior', 'minimal'),
      seniorFullBleed: getBorderTop('ats-senior', 'full-bleed'),
    };
    
    // Clean up
    testDiv.remove();
    preview.removeAttribute('data-hstyle');
    
    return results;
  });
  
  console.log("Verification results:", JSON.stringify(borderStyles, null, 2));
  
  await browser.close();
}

main().catch(console.error);
