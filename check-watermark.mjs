import { chromium } from 'playwright';

const RID = '6a5bca78de32f7b3405098df';
const browser = await chromium.launch({ headless: true });
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

const data = await page.evaluate(() => {
  const article = document.getElementById('resume-preview');
  const watermark = article.querySelector('.watermark-footer');
  const wrapper = article.querySelector('.rp-content-wrapper');
  const sections = [...article.querySelectorAll('.rp-section')];

  // Get all elements with borders near the bottom
  const allElements = article.querySelectorAll('*');
  const withBorders = [...allElements].map(el => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const articleRect = article.getBoundingClientRect();
    const relTop = Math.round(rect.top - articleRect.top);

    // Only include if near bottom (last 200px) and has a visible border
    if (relTop > 1900 && (
      cs.borderBottom !== '0px none rgb(26, 26, 26)' ||
      cs.borderTop !== '0px none rgb(26, 26, 26)'
    )) {
      return {
        tag: el.tagName,
        classes: el.className,
        relTop,
        relBottom: Math.round(rect.bottom - articleRect.top),
        borderTop: cs.borderTop,
        borderBottom: cs.borderBottom,
        text: el.textContent?.trim().slice(0, 50)
      };
    }
    return null;
  }).filter(x => x);

  return {
    watermarkExists: !!watermark,
    watermarkText: watermark?.textContent,
    watermarkPosition: watermark ? {
      relTop: Math.round(watermark.getBoundingClientRect().top - article.getBoundingClientRect().top),
      relBottom: Math.round(watermark.getBoundingClientRect().bottom - article.getBoundingClientRect().top)
    } : null,
    wrapperBottom: Math.round(wrapper.getBoundingClientRect().bottom - article.getBoundingClientRect().top),
    lastSectionBottom: sections.length ? Math.round(sections[sections.length-1].getBoundingClientRect().bottom - article.getBoundingClientRect().top) : null,
    articleHeight: article.offsetHeight,
    elementsWithBordersNearBottom: withBorders,
    allArticleChildren: [...article.children].map(c => ({ tag: c.tagName, classes: c.className }))
  };
});

console.log(JSON.stringify(data, null, 2));

// Also download PDF to check
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 120000 }),
  page.click('button:has-text("Download PDF")')
]);
await download.saveAs('/c/Users/ACER/Documents/GitHub/output/current_test.pdf');
console.log('\nPDF downloaded to output/current_test.pdf');

await browser.close();
