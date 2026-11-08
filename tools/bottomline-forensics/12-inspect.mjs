import { openEditor } from './lib-harness.mjs';
import fs from 'fs';
const TEMPLATE = process.argv[2] || 'template1';
const OUT = 'tools/bottomline-forensics/out';
const { browser, page, logs } = await openEditor({ template: TEMPLATE });
await page.evaluate(() => { const p=document.querySelector('.editor-preview-panel'); p.scrollTop=p.scrollHeight; });
await page.waitForTimeout(600);

const ev = await page.evaluate(() => {
  const art = document.getElementById('resume-preview');
  const ar = art.getBoundingClientRect();
  const out = { article:{w:Math.round(ar.width),h:Math.round(ar.height)}, children:[], lineCandidates:[] };
  const px=v=>parseFloat(v)||0;
  const dark=c=>{ if(!c||c==='transparent')return false; const m=c.match(/rgba?\(([^)]+)\)/); if(!m)return false;
    const p=m[1].split(',').map(Number); const a=p.length>3?p[3]:1; if(a<0.2)return false; return (p[0]+p[1]+p[2])/3<100; };
  const name=el=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).join('.'):'');
  // direct children geometry
  for (const el of art.children) {
    const r=el.getBoundingClientRect(), cs=getComputedStyle(el);
    out.children.push({sel:name(el),relTop:Math.round(r.top-ar.top),relBottom:Math.round(r.bottom-ar.top),h:Math.round(r.height),w:Math.round(r.width),pos:cs.position,bt:cs.borderTop,bb:cs.borderBottom,bg:cs.backgroundColor});
  }
  // every element + pseudo with a dark hairline-ish rendering
  for (const el of [art, ...art.querySelectorAll('*')]) {
    const r=el.getBoundingClientRect(); if(!r.width||!r.height) continue;
    for (const ps of [null,'::before','::after']) {
      const cs=getComputedStyle(el, ps||undefined);
      if(ps && (cs.content==='none'||cs.content==='normal')) continue;
      if(cs.display==='none'||cs.visibility==='hidden') continue;
      const f=[];
      if(px(cs.borderTopWidth)>0&&dark(cs.borderTopColor)) f.push('border-top '+cs.borderTopWidth+' '+cs.borderTopColor);
      if(px(cs.borderBottomWidth)>0&&dark(cs.borderBottomColor)) f.push('border-bottom '+cs.borderBottomWidth+' '+cs.borderBottomColor);
      if(dark(cs.backgroundColor)&&px(cs.height)<=10&&px(cs.height)>0) f.push('bg '+cs.backgroundColor+' h='+cs.height);
      if (!f.length) continue;
      if (r.width < ar.width*0.45) continue;
      out.lineCandidates.push({sel:name(el),pseudo:ps,relTop:Math.round(r.top-ar.top),relBottom:Math.round(r.bottom-ar.top),w:Math.round(r.width),h:Math.round(r.height),f});
    }
  }
  const secs=[...art.querySelectorAll('.rp-section')];
  out.lastSectionBottom = secs.length?Math.round(secs[secs.length-1].getBoundingClientRect().bottom-ar.top):null;
  out.lastSectionText = secs.length?secs[secs.length-1].innerText.slice(0,60):null;
  return out;
});
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(`${OUT}/dom-${TEMPLATE}.json`, JSON.stringify(ev,null,2));
const el = await page.$('#resume-preview');
await el.screenshot({ path: `${OUT}/preview-${TEMPLATE}.png` });
console.log('ART', JSON.stringify(ev.article), 'lastSectionBottom', ev.lastSectionBottom, '|', ev.lastSectionText);
console.log('CHILDREN', JSON.stringify(ev.children,null,1));
console.log('CANDIDATES', JSON.stringify(ev.lineCandidates,null,1));
console.log('LOGS', logs.filter(l=>l.startsWith('error')||l.startsWith('pageerror')).slice(0,5));
await browser.close();
