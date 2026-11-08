import { chromium } from 'playwright';
import fs from 'fs';
import { loadResume, RID, BASE } from './lib-harness.mjs';
const OUT='tools/bottomline-forensics/out'; fs.mkdirSync(OUT,{recursive:true});
const TAG=process.argv[2]||'before';
const tpl=process.argv[3]||'ats_senior';
const resume={ ...loadResume(tpl), template:tpl, decoratives:{} };
const user={id:'u',name:'F',email:'f@v.local',subscriptionPlan:'free',emailVerified:true};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1100}});
await page.addInitScript(()=>sessionStorage.setItem('token','t'));
let capturedHtml=null;
await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(!u.pathname.startsWith('/api/'))return route.continue();
  if(u.pathname==='/api/auth/profile')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});
  if(u.pathname===`/api/resumes/${RID}`&&route.request().method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(resume)});
  if(u.pathname.endsWith('/export-pdf')){
    try{ const b=JSON.parse(route.request().postData()); capturedHtml=b.htmlContent; }catch(e){ console.log('parse err',e.message); }
    return route.fulfill({status:200,contentType:'application/pdf',body:'%PDF-1.4 stub'});
  }
  return route.fulfill({status:200,contentType:'application/json',body:'{}'});
});
await page.goto(`${BASE}/resume/${RID}/edit`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#resume-preview',{timeout:30000});
await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1200);
await page.evaluate(async()=>{ try{ await window.getPDFBlob(); }catch(e){} });
await page.waitForTimeout(500);
if(!capturedHtml){ console.log('NO HTML CAPTURED'); process.exit(2); }
fs.writeFileSync(`${OUT}/export-${TAG}.html`, capturedHtml);
console.log('saved HTML bytes', capturedHtml.length, '| watermark print rule:', /\.watermark-footer\{display:none/.test(capturedHtml)?'display:none':'other');
console.log('has rp-ats-senior:', capturedHtml.includes('rp-ats-senior'));
await browser.close();
