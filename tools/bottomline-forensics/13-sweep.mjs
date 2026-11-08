import { chromium } from 'playwright';
import fs from 'fs';
import { loadResume, RID, BASE } from './lib-harness.mjs';

const OUT = 'tools/bottomline-forensics/out';
fs.mkdirSync(OUT, { recursive:true });
const TEMPLATES = `template1 template2 template3 premium1 premium2 premium3 premium4 premium5 premium6 premium7 premium8 premium9 premium10 consulting_bcg tech_faang harvard_ats swiss_minimal ats_classic ats_entry ats_senior ats_lead ats_intern ats_experienced academic_cv engineer_ats`.split(' ');
const PLAN = process.argv[2] || 'free';
const browser = await chromium.launch({ headless: true });
const results = [];

async function scanPng(page, b64) {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const rows = [];
    for (let y = 0; y < c.height; y++) {
      let dark = 0;
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const a = d[i+3];
        const lum = (d[i] + d[i+1] + d[i+2]) / 3;
        if (a > 200 && lum < 110) dark++;
      }
      rows.push(dark / c.width);
    }
    const bands = [];
    let start = -1;
    for (let y = 0; y <= rows.length; y++) {
      const hit = y < rows.length && rows[y] >= 0.85;
      if (hit && start < 0) start = y;
      if (!hit && start >= 0) { bands.push({ y0: start, y1: y - 1, coverage: Math.max(...rows.slice(start, y)) }); start = -1; }
    }
    return { w: c.width, h: c.height, bands };
  }, b64);
}

for (const tpl of TEMPLATES) {
  const resume = loadResume(tpl);
  const user = { id:'forensicuser', name:'Forensic Tester', email:'forensic@vresiq.local', subscriptionPlan: PLAN === 'free' ? 'free' : 'premium', emailVerified:true };
  const page = await browser.newPage({ viewport:{ width:1680, height:1100 } });
  await page.addInitScript(()=>sessionStorage.setItem('token','forensic-token'));
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    if (!u.pathname.startsWith('/api/')) return route.continue();
    if (u.pathname === '/api/auth/profile') return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(user) });
    if (u.pathname === `/api/resumes/${RID}` && route.request().method()==='GET') return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(resume) });
    return route.fulfill({ status:200, contentType:'application/json', body:'{}' });
  });
  await page.goto(`${BASE}/resume/${RID}/edit`, { waitUntil:'domcontentloaded' });
  try { await page.waitForSelector('#resume-preview', { timeout:20000 }); } catch { results.push({ tpl, error:'no preview' }); await page.close(); continue; }
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{ const p=document.querySelector('.editor-preview-panel'); p.scrollTop=0; });
  await page.waitForTimeout(300);
  const el = await page.$('#resume-preview');
  const b64 = (await el.screenshot()).toString('base64');
  fs.writeFileSync(`${OUT}/sweep-${PLAN}-${tpl}.png`, Buffer.from(b64,'base64'));
  const pix = await scanPng(page, b64);
  const geo = await page.evaluate(() => {
    const art = document.getElementById('resume-preview');
    const ar = art.getBoundingClientRect();
    const secs=[...art.querySelectorAll('.rp-section')];
    return { h: Math.round(ar.height), w: Math.round(ar.width), contentBottom: Math.round((art.querySelector('.rp-content-wrapper')?.getBoundingClientRect().bottom||ar.top)-ar.top), lastSectionBottom: secs.length?Math.round(secs[secs.length-1].getBoundingClientRect().bottom-ar.top):null, tpl: art.getAttribute('data-template') };
  });
  results.push({ tpl, ...geo, bands: pix.bands.filter(b=>b.y1-b.y0<=8) });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 1));
fs.writeFileSync(`${OUT}/sweep-${PLAN}.json`, JSON.stringify(results,null,2));
