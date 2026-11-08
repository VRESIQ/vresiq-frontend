import { chromium } from 'playwright';
import fs from 'fs';
import { loadResume, RID, BASE } from './lib-harness.mjs';

const OUT='tools/bottomline-forensics/out'; fs.mkdirSync(OUT,{recursive:true});
const resume = { ...loadResume('template1'), template:'ats_senior', decoratives:{} };
const user = { id:'u', name:'Forensic Tester', email:'f@v.local', subscriptionPlan:'free', emailVerified:true };
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1680, height:1100 } });
await page.addInitScript(()=>sessionStorage.setItem('token','t'));
await page.route('**/*', route => {
  const u=new URL(route.request().url());
  if(!u.pathname.startsWith('/api/')) return route.continue();
  if(u.pathname==='/api/auth/profile') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});
  if(u.pathname===`/api/resumes/${RID}` && route.request().method()==='GET') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(resume)});
  return route.fulfill({status:200,contentType:'application/json',body:'{}'});
});
await page.goto(`${BASE}/resume/${RID}/edit`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#resume-preview',{timeout:30000});
await page.evaluate(()=>document.fonts.ready);
await page.waitForTimeout(1500);

async function scan(tag){
  const el=await page.$('#resume-preview');
  const b64=(await el.screenshot()).toString('base64');
  fs.writeFileSync(`${OUT}/ats-senior-${tag}.png`, Buffer.from(b64,'base64'));
  return page.evaluate(async (b64)=>{
    const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode();
    const c=document.createElement('canvas'); c.width=img.width;c.height=img.height;
    const x=c.getContext('2d'); x.drawImage(img,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data;
    const rows=[];
    for(let y=0;y<c.height;y++){let dark=0;for(let px=0;px<c.width;px++){const i=(y*c.width+px)*4;const lum=(d[i]+d[i+1]+d[i+2])/3;if(d[i+3]>200&&lum<110)dark++;}rows.push(dark/c.width);}
    const bands=[];let s=-1;
    for(let y=0;y<=rows.length;y++){const hit=y<rows.length&&rows[y]>=0.9;if(hit&&s<0)s=y;if(!hit&&s>=0){bands.push({y0:s,y1:y-1,cov:+Math.max(...rows.slice(s,y)).toFixed(3)});s=-1;}}
    return {h:c.height,w:c.width,bands};
  }, b64);
}

const geo = await page.evaluate(()=>{
  const art=document.getElementById('resume-preview'); const ar=art.getBoundingClientRect();
  const cont=art.querySelector('.rp-ats-container');
  const cr=cont.getBoundingClientRect(); const cs=getComputedStyle(cont);
  const wrapper=art.querySelector('.rp-content-wrapper');
  return {
    article:{h:Math.round(ar.height),w:Math.round(ar.width),padBottom:getComputedStyle(art).paddingBottom,padTop:getComputedStyle(art).paddingTop},
    container:{cls:cont.className, relTop:Math.round(cr.top-ar.top), relBottom:Math.round(cr.bottom-ar.top), borderBottom:cs.borderBottom, borderTop:cs.borderTop, accent:cs.getPropertyValue('--accent').trim()},
    wrapperBottom: Math.round(wrapper.getBoundingClientRect().bottom-ar.top)
  };
});
const before = await scan('before');
console.log('GEO', JSON.stringify(geo,null,1));
console.log('BEFORE bands', JSON.stringify(before.bands));

// EXPERIMENT: disable only the container bottom border
await page.addStyleTag({ content: '.rp-ats-senior{border-bottom:none !important}' });
await page.waitForTimeout(300);
const after = await scan('after-noborder');
console.log('AFTER bands', JSON.stringify(after.bands));

// restore & instead neutralize only the watermark? (control) - not needed
await browser.close();
fs.writeFileSync(`${OUT}/ats-senior-evidence.json`, JSON.stringify({geo,before,after},null,2));
