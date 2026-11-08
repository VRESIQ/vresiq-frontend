import { chromium } from 'playwright';
import fs from 'fs';

export const BASE = 'http://localhost:5180';
export const RID = 'forensicresume0000000001';

export function loadResume(template) {
  const all = JSON.parse(fs.readFileSync(new URL('../../../resumes.json', import.meta.url), 'utf8'));
  const r = { ...(all.find(x => x.template === template) || all[0]) };
  r.template = template;
  r._id = RID;
  return r;
}

export async function openEditor({ template = 'template1', plan = 'free', resume: override = null } = {}) {
  const resume = override || loadResume(template);
  const user = { id:'forensicuser', name:'Forensic Tester', email:'forensic@vresiq.local', subscriptionPlan: plan, emailVerified: true };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1100 } });
  const logs = [];
  page.on('console', m => logs.push(m.type()+': '+m.text().slice(0,300)));
  page.on('pageerror', e => logs.push('pageerror: '+String(e).slice(0,300)));
  await page.addInitScript(() => sessionStorage.setItem('token','forensic-token'));
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    if (!u.pathname.startsWith('/api/')) return route.continue();
    if (u.pathname === '/api/auth/profile') return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(user) });
    if (u.pathname === `/api/resumes/${RID}` && route.request().method() === 'GET')
      return route.fulfill({ status:200, contentType:'application/json', body: JSON.stringify(resume) });
    return route.fulfill({ status:200, contentType:'application/json', body: '{}' });
  });
  await page.goto(`${BASE}/resume/${RID}/edit`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#resume-preview', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  return { browser, page, resume, user, logs };
}
