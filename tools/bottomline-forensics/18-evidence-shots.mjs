import { openEditor } from './lib-harness.mjs';
import fs from 'fs';
const OUT='tools/bottomline-forensics/out';
const { browser, page } = await openEditor({ template:'ats_senior' });
await page.evaluate(()=>{const p=document.querySelector('.editor-preview-panel');p.scrollTop=0;});
await page.waitForTimeout(400);
const el=await page.$('#resume-preview');
// AFTER (current code)
fs.writeFileSync(`${OUT}/EVIDENCE-after.png`, await el.screenshot());
// BEFORE (recreate only the removed declaration in the live app, as the experimental control)
await page.addStyleTag({ content: '.rp-ats-senior{border-bottom:2px solid var(--accent) !important;}' });
await page.waitForTimeout(300);
fs.writeFileSync(`${OUT}/EVIDENCE-before.png`, await el.screenshot());
const geo=await page.evaluate(()=>{
  const a=document.getElementById('resume-preview');
  const c=a.querySelector('.rp-ats-senior');
  const ar=a.getBoundingClientRect(), cr=c.getBoundingClientRect();
  return {contentBottom:Math.round(cr.bottom-ar.top), articleBottom:Math.round(ar.bottom-ar.top), borderBottom:getComputedStyle(c).borderBottom, watermark:!!a.querySelector('.watermark-footer')};
});
console.log(JSON.stringify(geo));
await browser.close();
