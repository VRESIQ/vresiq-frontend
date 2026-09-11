import { chromium } from 'playwright';

const RID = process.argv[2];
const OUT = process.argv[3] || 'bottom.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@vresiq.com');
await page.fill('input[type="password"]', 'admin2026@vresiq2026');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 20000 });

let rid = RID;
if (!rid) {
  const list = await page.evaluate(async () => {
    const t = sessionStorage.getItem('token');
    const r = await fetch('/api/resumes', { headers: { Authorization: 'Bearer ' + t } });
    return r.ok ? await r.json() : { status: r.status };
  });
  console.log('LIST', JSON.stringify(list).slice(0, 2000));
  await browser.close();
  process.exit(0);
}

await page.goto(`http://localhost:5173/resume/${rid}/edit`, { waitUntil: 'networkidle' });
await page.waitForSelector('#resume-preview', { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const panel = await page.$('.editor-preview-panel');
await page.evaluate(() => { const p = document.querySelector('.editor-preview-panel'); p.scrollTop = p.scrollHeight; });
await page.waitForTimeout(500);
await panel.screenshot({ path: OUT });

const info = await page.evaluate(() => {
  const pv = document.getElementById('resume-preview');
  const r = pv.getBoundingClientRect();
  return {
    pvHeight: pv.offsetHeight,
    articleBottom: Math.round(r.bottom),
    watermark: pv.querySelector('.watermark-footer')?.textContent,
  };
});
console.log('INFO', JSON.stringify(info));
await browser.close();
