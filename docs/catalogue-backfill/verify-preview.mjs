import { chromium } from '/Users/hamishburke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const root=new URL('.',import.meta.url).pathname,entries=JSON.parse(await fs.readFile(root+'preview-stories.json','utf8'));
await fs.mkdir(root+'page-previews',{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const result=[];
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
 for(const e of entries){
  const response=await page.goto('http://localhost:4371/work/'+e.slug,{waitUntil:'networkidle'});
  const checks=await page.evaluate(()=>({h1:document.querySelector('h1')?.textContent?.trim(),images:[...document.querySelectorAll('main img')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,alt:i.alt})),overflow:document.documentElement.scrollWidth>innerWidth+1,body:document.querySelector('main')?.textContent}));
  const failures=[];if(response?.status()!==200)failures.push('status');if(checks.h1!==e.title)failures.push('heading');if(checks.images.some(i=>!i.loaded||!i.alt))failures.push('image');if(checks.overflow)failures.push('overflow');if(!checks.body.includes(e.summary)&&!checks.body.includes(e.introduction))failures.push('introduction');
  result.push({slug:e.slug,width,status:response?.status(),failures});
  if((width===1440&&['echo-stats-finder','articulate-ai','bedroom-layout-designer','grid-diffusion-ad','drop-eta','alphero-voice-skill'].includes(e.slug))||(width===390&&['wellington-transport-network','articulate-ai'].includes(e.slug)))await page.screenshot({path:root+'page-previews/'+e.slug+'-'+width+'.png',fullPage:true});
 }
 await page.close();
}
const gallery=await browser.newPage({viewport:{width:1440,height:1000}});await gallery.goto('http://localhost:4372/review.html',{waitUntil:'networkidle'});const cards=await gallery.locator('article').count();await gallery.screenshot({path:root+'page-previews/gallery.png'});await browser.close();
await fs.writeFile(root+'preview-validation.json',JSON.stringify({checkedAt:new Date().toISOString(),galleryCards:cards,pages:result},null,2));
console.log('Checked',result.length,'page/viewports;',cards,'review cards; failures:',result.filter(r=>r.failures.length));if(cards!==38||result.some(r=>r.failures.length))process.exitCode=1;
