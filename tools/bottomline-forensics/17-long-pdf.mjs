import { chromium } from 'playwright';
import fs from 'fs';
import { loadResume, RID, BASE } from './lib-harness.mjs';
const OUT='tools/bottomline-forensics/out'; fs.mkdirSync(OUT,{recursive:true});
const TAG=process.argv[2]||'after';
const base=loadResume('template1');
const exp=base.workExperience&&base.workExperience.length?base.workExperience:[{role:'Engineer',company:'Acme',startDate:'2020',endDate:'2022',description:'Built systems.'}];
const long={ ...base, template:'ats_senior', decoratives:{},
  workExperience: Array.from({length:10},(_,i)=>({...exp[i%exp.length], role:`Senior Engineer ${i+1}`})),
  projects: Array.from({length:6},(_,i)=>({...((base.projects&&base.projects[0])||{title:'Project',description:'Built a thing.'}), title:`Platform ${i+1}`})),
};
const short={ ...base, template:'ats_senior', decoratives:{} };
async function run(resume,label){
  const user={id:'u',name:'F',email:'f@v.local',subscriptionPlan:'free',emailVerified:true};
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1680,height:1100}});
  await page.addInitScript(()=>sessionStorage.setItem('token','t'));
  let html=null;
  await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(!u.pathname.startsWith('/api/'))return route.continue();
    if(u.pathname==='/api/auth/profile')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(user)});
    if(u.pathname===`/api/resumes/${RID}`&&route.request().method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(resume)});
    if(u.pathname.endsWith('/export-pdf')){ try{html=JSON.parse(route.request().postData()).htmlContent;}catch{} return route.fulfill({status:200,contentType:'application/pdf',body:'x'}); }
    return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  });
  await page.goto(`${BASE}/resume/${RID}/edit`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#resume-preview',{timeout:30000});
  await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(1300);
  const geo=await page.evaluate(()=>{
    const a=document.getElementById('resume-preview'); const ar=a.getBoundingClientRect();
    const c=a.querySelector('.rp-ats-container');
    return {h:Math.round(ar.height),pages:Math.ceil(ar.height/1056),borderBottom:getComputedStyle(c).borderBottom,
      watermark:!!a.querySelector('.watermark-footer'), watermarkText:a.querySelector('.watermark-footer')?.textContent};
  });
  const el=await page.$('#resume-preview');
  fs.writeFileSync(`${OUT}/long-${TAG}-${label}.png`, await el.screenshot());
  await page.evaluate(async()=>{try{await window.getPDFBlob();}catch(e){}});
  await page.waitForTimeout(400);
  if(html) fs.writeFileSync(`${OUT}/export-${TAG}-${label}.html`, html);
  await browser.close();
  return {geo, captured:!!html};
}
const s=await run(short,'one');
console.log('ONE-PAGE', JSON.stringify(s));
const l=await run(long,'multi');
console.log('MULTI', JSON.stringify(l));
