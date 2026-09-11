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

// Scroll to bottom
await page.evaluate(() => {
  const p = document.querySelector('.editor-preview-panel');
  p.scrollTop = p.scrollHeight;
});
await page.waitForTimeout(500);

// Inspect article children and computed styles
const data = await page.evaluate(() => {
  const article = document.getElementById('resume-preview');
  const children = [...article.children].map((el, idx) => {
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const articleRect = article.getBoundingClientRect();
    return {
      idx,
      tag: el.tagName,
      classes: el.className,
      id: el.id || '',
      relTop: Math.round(rect.top - articleRect.top),
      relBottom: Math.round(rect.bottom - articleRect.top),
      height: Math.round(rect.height),
      computed: {
        display: cs.display,
        borderTop: cs.borderTop,
        borderBottom: cs.borderBottom,
        background: cs.background.slice(0, 100),
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
      },
      text: el.textContent?.trim().slice(0, 40)
    };
  });

  // Check article's own ::after
  const articleAfter = getComputedStyle(article, '::after');

  // Find last actual content element
  const sections = [...article.querySelectorAll('.rp-section')];
  const lastSection = sections[sections.length - 1];
  const lastSectionRect = lastSection?.getBoundingClientRect();
  const articleRect = article.getBoundingClientRect();

  return {
    articleHeight: article.offsetHeight,
    children,
    lastSectionBottom: lastSection ? Math.round(lastSectionRect.bottom - articleRect.top) : null,
    articleAfter: {
      display: articleAfter.display,
      content: articleAfter.content,
      borderTop: articleAfter.borderTop,
      borderBottom: articleAfter.borderBottom,
      height: articleAfter.height,
    }
  };
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
