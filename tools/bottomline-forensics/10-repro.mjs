import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:5180';
const RID = 'forensicresume0000000001';
const TEMPLATE = process.argv[2] || 'template1';
const OUT = process.argv[3] || 'tools/bottomline-forensics/out';

const all = JSON.parse(fs.readFileSync('../resumes.json','utf8'));
const resume = all.find(r => r.template === TEMPLATE) || all[0];
resume._id = RID;

const user = { id:'forensicuser', name:'Forensic Tester', email:'forensic@vresiq.local', subscriptionPlan:'free', emailVerified:true };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1100 } });
page.addInitScript(() => sessionStorage.setItem('token','forensic-token'));

await page.route('**/api/**', r => r.fulfill({ status:200, contentType:'application/json', body:'{}' }));
await page.route(`**/api/resumes/${RID}`, r => {
  if (r.request().method() === 'GET') return r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(resume) });
  return r.fulfill({ status:200, contentType:'application/json', body:'{}' });
});
await page.route('**/api/auth/profile', r => r.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(user) }));

await page.goto(`${BASE}/resume/${RID}/edit`, { waitUntil:'domcontentloaded' });
page.on('console', m => { if (m.type()==='error') console.log('CERR', m.text().slice(0,200)); });
try { await page.waitForSelector('#resume-preview', { timeout: 20000 }); }
catch(e) { console.log('URL', page.url()); console.log('BODY', (await page.evaluate(()=>document.body.innerText)).slice(0,600)); throw e; }
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1800);

// scroll preview panel to bottom
await page.evaluate(() => { const p = document.querySelector('.editor-preview-panel'); p.scrollTop = p.scrollHeight; });
await page.waitForTimeout(600);

const evidence = await page.evaluate(() => {
  const art = document.getElementById('resume-preview');
  const ar = art.getBoundingClientRect();
  const artW = ar.width;
  const out = { article: { w: Math.round(ar.width), h: Math.round(ar.height), top: Math.round(ar.top) }, sem: [] };
  const px = (v) => parseFloat(v) || 0;
  const darkish = (c) => {
    if (!c || c === 'transparent') return false;
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return false;
    const p = m[1].split(',').map(Number);
    const a = p.length > 3 ? p[3] : 1;
    if (a < 0.25) return false;
    const [r,g,b] = p;
    return (r + g + b) / 3 < 90;
  };
  const els = [art, ...art.querySelectorAll('*')];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const relTop = Math.round(r.top - ar.top), relBottom = Math.round(r.bottom - ar.top);
    for (const pseudo of [null, '::before', '::after']) {
      const s = pseudo ? getComputedStyle(el, pseudo) : cs;
      if (pseudo && (s.content === 'none' || s.content === 'normal')) continue;
      const bt = s.borderTopWidth, bb = s.borderBottomWidth;
      const btc = s.borderTopColor, bbc = s.borderBottomColor;
      const flags = [];
      if (pseudo) {
        // pseudo rect approximated from parent
        if (px(bt) > 0 && darkish(btc)) flags.push(`border-top ${bt} ${btc}`);
        if (px(bb) > 0 && darkish(bbc)) flags.push(`border-bottom ${bb} ${bbc}`);
        if (s.backgroundColor && darkish(s.backgroundColor) && px(s.height || '0') > 0 && px(s.height) <= 8) flags.push(`bg ${s.backgroundColor} h=${s.height}`);
      } else {
        if (px(bt) > 0 && darkish(btc)) flags.push(`border-top ${bt} ${btc}`);
        if (px(bb) > 0 && darkish(bbc)) flags.push(`border-bottom ${bb} ${bbc}`);
        if (darkish(s.backgroundColor) && r.height <= 8) flags.push(`bg ${s.backgroundColor}`);
      }
      if (!flags.length) continue;
      if (r.width < artW * 0.5) continue;
      out.sem.push({
        sel: (el.tagName.toLowerCase()) + (el.id ? '#'+el.id : '') + (el.className && typeof el.className === 'string' ? '.'+el.className.trim().split(/\s+/).join('.') : ''),
        pseudo, relTop, relBottom, w: Math.round(r.width), h: Math.round(r.height), flags,
      });
    }
    // also record elements after the last real section near the bottom
  }
  // last content bottom
  const sections = [...art.querySelectorAll('.rp-section, section')];
  const lastSection = sections[sections.length-1];
  out.lastSectionBottom = lastSection ? Math.round(lastSection.getBoundingClientRect().bottom - ar.top) : null;
  out.articleChildren = [...art.children].map(el => {
    const r = el.getBoundingClientRect(); const cs=getComputedStyle(el);
    return { tag: el.tagName, cls: String(el.className).slice(0,60), relTop: Math.round(r.top-ar.top), relBottom: Math.round(r.bottom-ar.top), h: Math.round(r.height), display: cs.display, position: cs.position, borderTop: cs.borderTop, borderBottom: cs.borderBottom, mt: cs.marginTop, mb: cs.marginBottom };
  });
  return out;
});

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/dom-${TEMPLATE}.json`, JSON.stringify(evidence, null, 2));
const art = await page.$('#resume-preview');
await art.screenshot({ path: `${OUT}/preview-${TEMPLATE}.png` });
console.log('TEMPLATE', TEMPLATE, JSON.stringify({article:evidence.article, lastSectionBottom:evidence.lastSectionBottom, candidates:evidence.sem.length, children:evidence.articleChildren.length}));
console.log('CANDIDATES', JSON.stringify(evidence.sem.slice(0,12), null, 1));
console.log('CHILDREN', JSON.stringify(evidence.articleChildren, null, 1));
await browser.close();
