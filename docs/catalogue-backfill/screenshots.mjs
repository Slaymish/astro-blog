import { chromium } from '/Users/hamishburke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const rows = [];
for (const [repo, url] of [['BedroomLayoutDesigner','https://bedroomlayout.app'],['PianoImprovisationHelper','https://pianoimprovisationhelper.netlify.app/'],['dropeta','https://dropeta.vercel.app']]) {
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  try {
    const response = await page.goto(url,{waitUntil:'networkidle',timeout:30000});
    const text = (await page.locator('body').innerText()).slice(0,1800);
    console.log(repo,response?.status(),text.replace(/\n/g,' ').slice(0,600));
    if (response?.ok() && !/NOT_FOUND|deployment.*not.*found/i.test(text)) {
      await page.screenshot({path:path.join(root,'media',repo+'.png')});
      rows.push({repo,path:'media/'+repo+'.png',source:url,kind:'live application screenshot',capturedAt:new Date().toISOString(),body:text});
    }
  } catch (e) {console.log(repo,e.message.slice(0,200));}
  await page.close();
}
await fs.writeFile(path.join(root,'screenshots.json'),JSON.stringify(rows,null,2));
await browser.close();
