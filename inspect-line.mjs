import { chromium } from 'playwright';

const RID = '6a5bca78de32f7b3405098df';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@vresiq.com');
await page.fill('input[type="password"]', 'admin2026@vresiq2026');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 20000 });

await page.goto(`http://localhost:5173/resume/${RID}/edit`, { waitUntil: 'networkidle' });
await page.waitForSelector('#resume-preview', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

// Scroll to bottom
await page.evaluate(() => {
  const p = document.querySelector('.editor-preview-panel');
  p.scrollTop = p.scrollHeight;
});
await page.waitForTimeout(500);

// Inspect bottom of resume
const inspection = await page.evaluate(() => {
  const article = document.getElementById('resume-preview');
  const watermark = article.querySelector('.watermark-footer');
  const wrapper = article.querySelector('.rp-content-wrapper');
  const sections = [...article.querySelectorAll('.rp-section')];
  const lastSection = sections[sections.length - 1];

  // Get all elements between last section and watermark
  const allChildren = [...article.children];
  const wrapperIdx = allChildren.indexOf(wrapper);
  const watermarkIdx = allChildren.indexOf(watermark);

  const betweenElements = allChildren.slice(wrapperIdx + 1, watermarkIdx).map(el => ({
    tag: el.tagName,
    classes: el.className,
    id: el.id,
    computed: {
      display: getComputedStyle(el).display,
      borderTop: getComputedStyle(el).borderTop,
      borderBottom: getComputedStyle(el).borderBottom,
      height: getComputedStyle(el).height,
      background: getComputedStyle(el).background,
      marginTop: getComputedStyle(el).marginTop,
      marginBottom: getComputedStyle(el).marginBottom,
    },
    text: el.textContent?.slice(0, 50)
  }));

  // Check wrapper itself
  const wrapperStyle = getComputedStyle(wrapper);
  const wrapperAfter = getComputedStyle(wrapper, '::after');

  // Check article itself
  const articleStyle = getComputedStyle(article);
  const articleAfter = getComputedStyle(article, '::after');

  return {
    articleBottom: article.getBoundingClientRect().bottom,
    articleHeight: article.offsetHeight,
    wrapperBottom: wrapper.getBoundingClientRect().bottom,
    wrapperHeight: wrapper.offsetHeight,
    watermarkTop: watermark?.getBoundingClientRect().top,
    lastSectionBottom: lastSection?.getBoundingClientRect().bottom,
    betweenElements,
    wrapperBorders: {
      top: wrapperStyle.borderTop,
      bottom: wrapperStyle.borderBottom,
      afterDisplay: wrapperAfter.display,
      afterContent: wrapperAfter.content,
      afterBorder: wrapperAfter.borderBottom,
    },
    articleBorders: {
      top: articleStyle.borderTop,
      bottom: articleStyle.borderBottom,
      afterDisplay: articleAfter.display,
      afterContent: articleAfter.content,
      afterBorder: articleAfter.borderBottom,
    }
  };
});

console.log(JSON.stringify(inspection, null, 2));

// Keep browser open for manual inspection
console.log('\n\nBrowser kept open for manual inspection. Press Ctrl+C to close.');
await new Promise(() => {});
