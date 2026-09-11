import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@vresiq.com');
await page.fill('input[type="password"]', 'admin2026@vresiq2026');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 20000 });

// Modify the subscription plan temporarily in memory by patching the API response
await page.route('**/api/auth/user', async route => {
  const response = await route.fetch();
  const json = await response.json();
  json.subscriptionPlan = 'free'; // Force free plan
  await route.fulfill({ response, json });
});

// Reload to trigger the route
await page.reload({ waitUntil: 'networkidle' });

const RID = '6a5bca78de32f7b3405098df';
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

// Screenshot the bottom
const panel = await page.$('.editor-preview-panel');
await panel.screenshot({ path: '/c/Users/ACER/Documents/GitHub/output/with_watermark.png' });

// Inspect elements
const data = await page.evaluate(() => {
  const article = document.getElementById('resume-preview');
  const watermark = article.querySelector('.watermark-footer');
  const wrapper = article.querySelector('.rp-content-wrapper');
  const sections = [...article.querySelectorAll('.rp-section')];
  const lastSection = sections[sections.length - 1];

  const articleRect = article.getBoundingClientRect();

  // Find all elements with visible borders in the bottom 200px
  const allElements = [...article.querySelectorAll('*')];
  const withBorders = allElements.map(el => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const relTop = Math.round(rect.top - articleRect.top);

    if (relTop > article.offsetHeight - 200) {
      const hasBorder = cs.borderTop !== '0px none rgb(26, 26, 26)' ||
                        cs.borderBottom !== '0px none rgb(26, 26, 26)';
      if (hasBorder) {
        return {
          tag: el.tagName,
          classes: el.className,
          relTop,
          relBottom: Math.round(rect.bottom - articleRect.top),
          borderTop: cs.borderTop,
          borderBottom: cs.borderBottom,
          background: cs.background.slice(0, 80),
        };
      }
    }
    return null;
  }).filter(x => x);

  return {
    watermarkExists: !!watermark,
    watermarkText: watermark?.textContent?.trim(),
    watermarkTop: watermark ? Math.round(watermark.getBoundingClientRect().top - articleRect.top) : null,
    watermarkBottom: watermark ? Math.round(watermark.getBoundingClientRect().bottom - articleRect.top) : null,
    wrapperBottom: Math.round(wrapper.getBoundingClientRect().bottom - articleRect.top),
    lastSectionBottom: Math.round(lastSection.getBoundingClientRect().bottom - articleRect.top),
    articleHeight: article.offsetHeight,
    elementsWithBorders: withBorders,
  };
});

console.log(JSON.stringify(data, null, 2));

// Also download PDF
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 120000 }),
  page.click('button:has-text("Download PDF")')
]);
await download.saveAs('/c/Users/ACER/Documents/GitHub/output/freeplan_test.pdf');
console.log('\nPDF downloaded');

await browser.close();
