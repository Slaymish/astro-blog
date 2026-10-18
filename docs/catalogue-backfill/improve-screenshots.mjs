import { chromium } from '/Users/hamishburke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const rows=JSON.parse(await fs.readFile('docs/catalogue-backfill/screenshots.json','utf8'));
for(const repo of ['BedroomLayoutDesigner','dropeta']){
 const row=rows.find(x=>x.repo===repo),page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto(row.source,{waitUntil:'networkidle'});
 if(repo==='BedroomLayoutDesigner'){
  await page.getByRole('button',{name:'Start Planning',exact:true}).click();
  await page.getByRole('button',{name:'Save Dimensions',exact:true}).click();
  console.log('BEDROOM BUTTONS',await page.getByRole('button').allTextContents());
 }else{
  await page.getByRole('button',{name:'Hide map',exact:true}).click();
 }
 await page.waitForTimeout(1200);
 await page.screenshot({path:'docs/catalogue-backfill/'+row.path});
 row.body=(await page.locator('body').innerText()).slice(0,1800);row.capturedAt=new Date().toISOString();
 await page.close();
}
await fs.writeFile('docs/catalogue-backfill/screenshots.json',JSON.stringify(rows,null,2));await browser.close();
