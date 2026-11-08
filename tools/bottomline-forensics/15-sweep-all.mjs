import { chromium } from 'playwright';
import fs from 'fs';
import { loadResume, RID, BASE } from './lib-harness.mjs';
const OUT='tools/bottomline-forensics/out'; fs.mkdirSync(OUT,{recursive:true});
const TEMPLATES=`template1 template2 template3 premium1 premium2 premium3 premium4 premium5 premium6 premium7 premium8 premium9 premium10 consulting_bcg tech_faang harvard_ats swiss_minimal ats_classic ats_entry ats_senior ats_lead ats_intern ats_experienced academic_cv engineer_ats`.split(' ');
const PLAN=process.argv[2]||'free';
const browser=await chromium.launch({headless:true});
const results=[];
for (const tpl of TEMPLATES){
  const resume={ ...loadResume(tpl), template:tpl, decoratives:{} };
  const user={id:'u',name:'F',email:'f@v.local',subscriptionPlan:PLAN==='free'?'free':'premium',emailVerified:true};
  const page=await browser.newPage({viewport:{width:1680,height:1100}});
  await page.addInitScript(()=>sessionStorage.setItem('token','t'));
  await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(!u.pathname.startsWith('/api/'))return route.continue();
    if(u.pathname==='/api/auth/profile')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});
    if(u.pathname===`/api/resumes/${RID}`&&route.request().method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(resume)});
    return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  });
  await page.goto(`${BASE}/resume/${RID}/edit`,{waitUntil:'domcontentloaded'});
  try{await page.waitForSelector('#resume-preview',{timeout:20000});}catch{results.push({tpl,error:'no preview'});await page.close();continue;}
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1100);
  await page.evaluate(()=>{const p=document.querySelector('.editor-preview-panel');p.scrollTop=0;});
  await page.waitForTimeout(250);
  const el=await page.$('#resume-preview');
  const b64=(await el.screenshot()).toString('base64');
  if(PLAN==='free') fs.writeFileSync(`${OUT}/all-${tpl}.png`,Buffer.from(b64,'base64'));
  const pix=await page.evaluate(async(b64)=>{
    const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
    const x=c.getContext('2d');x.drawImage(img,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data;const rows=[];
    for(let y=0;y<c.height;y++){let dark=0;for(let p=0;p<c.width;p++){const i=(y*c.width+p)*4;const lum=(d[i]+d[i+1]+d[i+2])/3;if(d[i+3]>200&&lum<110)dark++;}rows.push(dark/c.width);}
    const bands=[];let s=-1;
    for(let y=0;y<=rows.length;y++){const hit=y<rows.length&&rows[y]>=0.88;if(hit&&s<0)s=y;if(!hit&&s>=0){bands.push({y0:s,y1:y-1,cov:+Math.max(...rows.slice(s,y)).toFixed(3)});s=-1;}}
    return {h:c.height,w:c.width,bands};
  },b64);
  const geo=await page.evaluate(()=>{
    const art=document.getElementById('resume-preview');const ar=art.getBoundingClientRect();
    const wrap=art.querySelector('.rp-content-wrapper');
    const wb=wrap.getBoundingClientRect().bottom-ar.top;
    const cs=getComputedStyle(art);
    // find full-width elements whose bottom edge sits near the content bottom
    const cands=[];
    for(const e of [art,...art.querySelectorAll('*')]){
      const r=e.getBoundingClientRect(); if(!r.width||!r.height)continue;
      const cb=r.bottom-ar.top; const s=getComputedStyle(e);
      const darkBottom=(parseFloat(s.borderBottomWidth)>0&&(()=>{const m=s.borderBottomColor.match(/rgba?\(([^)]+)\)/);if(!m)return false;const p=m[1].split(',').map(Number);const a=p.length>3?p[3]:1;return a>=0.2&&(p[0]+p[1]+p[2])/3<110;})());
      const darkBg=s.backgroundColor.match(/rgba?\(([^)]+)\)/)?(()=>{const p=s.backgroundColor.match(/rgba?\(([^)]+)\)/)[1].split(',').map(Number);const a=p.length>3?p[3]:1;return a>=0.2&&(p[0]+p[1]+p[2])/3<110;})():false;
      if(!darkBottom&&!darkBg)continue;
      if(r.width<ar.width*0.85)continue;
      cands.push({cls:String(e.className||e.tagName).slice(0,70),relBottom:+cb.toFixed(1),borderBottom:s.borderBottom,bg:darkBg?s.backgroundColor:null});
    }
    return {articleH:Math.round(ar.height),articleW:Math.round(ar.width),wrapBottom:+wb.toFixed(1),padBottom:cs.paddingBottom,cands};
  });
  const near=geo.wrapBottom;
  const endBands=pix.bands.filter(b=>Math.abs((b.y1+1)-near)<=3||Math.abs(b.y0-near)<=3);
  results.push({tpl,articleH:geo.articleH,wrapBottom:geo.wrapBottom,padBottom:geo.padBottom,endBands,bottomCands:geo.cands.filter(c=>Math.abs(c.relBottom-near)<=3)});
  await page.close();
}
await browser.close();
for(const r of results){ console.log(r.tpl.padEnd(15),'h='+r.articleH,'contentBottom='+r.wrapBottom,'endBands='+JSON.stringify(r.endBands),'cands='+JSON.stringify(r.bottomCands)); }
fs.writeFileSync(`${OUT}/sweep-all-${PLAN}.json`,JSON.stringify(results,null,2));
