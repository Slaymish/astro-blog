import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '/Users/hamishburke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.dirname(new URL(import.meta.url).pathname),projects='/Users/hamishburke/Documents/Codex/project-media-2026-10-10';
const host=`:root{--background-primary:#fff;--background-secondary:#f6f6f6;--background-modifier-border:#ddd;--text-normal:#222;--text-muted:#666;--text-faint:#888;--text-accent:#705dcf;--interactive-accent:#705dcf;--interactive-normal:#f5f5f5;--color-accent:#705dcf;--font-ui-large:22px;--font-ui-medium:16px;--font-ui-small:14px;--font-ui-smaller:13px;--font-semibold:600;--font-monospace:monospace;--size-4-3:12px;--size-4-2:8px;--size-2-2:4px;--size-2-1:2px;--radius-s:4px;--radius-m:8px}*{box-sizing:border-box}body{margin:0;background:#e9e6e0;font:16px/1.5 system-ui;color:var(--text-normal);display:grid;place-items:center;height:100vh}article{width:840px;background:white;border:1px solid #ddd;border-radius:12px;overflow:hidden;box-shadow:0 15px 50px #0002}header,footer{padding:14px 25px;background:#f6f6f6;font-size:14px;color:#666}header{display:flex;justify-content:space-between;border-bottom:1px solid #ddd}footer{border-top:1px solid #ddd;font-size:12px}#capture{padding:20px}button{border:1px solid #ddd;border-radius:5px;padding:8px 12px;font:14px system-ui;background:white;color:#222}.mod-cta{background:#705dcf;color:white;border-color:#705dcf}button:disabled{opacity:.5}.setting-item{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:1px solid #eee;padding:12px 0}.setting-item-info{flex:1}.setting-item-description{font-size:12px;color:#777}.setting-item-control{display:flex;gap:8px}.setting-item-heading{font-weight:600;border:none;padding-bottom:0}textarea{font:14px/1.5 system-ui;border:1px solid #bbb;border-radius:6px;padding:12px;resize:none}.checkbox-container{accent-color:#705dcf;width:22px;height:22px}input[type=range]{accent-color:#705dcf}h2{margin:0 0 10px}`;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
for(const name of ['Synod','Lumen']) {
 const page=await browser.newPage({viewport:{width:1600,height:1200}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const css=await fs.readFile(path.join(projects,name==='Synod'?'Synod/styles.css':'Lumen/obsidian-plugin/styles.css'),'utf8');
 await page.setContent(`<style>${host}\n${css}</style><article><header><span>${name}</span><span>Original plugin interface</span></header><div id="capture"></div><footer>Rendered from the project’s unmodified view and stylesheet · empty offline demonstration</footer></article>`);
 await page.addScriptTag({path:path.join(root,'plugin-views.js')});
 await page.evaluate(name=>window.renderProject(name),name);
 if(errors.length)throw Error(errors.join('\n'));
 await page.screenshot({path:path.join(root,name.toLowerCase()+'-cover.png')});
 await page.close();
}
await browser.close();
