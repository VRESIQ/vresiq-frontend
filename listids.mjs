import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'admin@vresiq.com');
await page.fill('input[type="password"]', 'admin2026@vresiq2026');
await page.click('button[type="submit"]');
await page.waitForURL('**/dashboard', { timeout: 20000 });
const list = await page.evaluate(async () => {
  const t = sessionStorage.getItem('token');
  const r = await fetch('/api/resumes', { headers: { Authorization: 'Bearer ' + t } });
  const j = await r.json();
  return j.map(x => ({ id: x.id, title: x.title, template: x.template, n: (x.workExperience||[]).length + '/' + (x.projects||[]).length }));
});
console.log(JSON.stringify(list, null, 1));
await browser.close();
