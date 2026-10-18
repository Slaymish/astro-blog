import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '/Users/hamishburke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root=path.dirname(new URL(import.meta.url).pathname),assetRoot='/Users/hamishburke/Documents/Codex/project-media-2026-10-10/assets';
const selected=JSON.parse(await fs.readFile(path.join(root,'selected-files.json'),'utf8'));
const entries=JSON.parse(await fs.readFile(path.resolve(root,'../editorial.json'),'utf8'));
const ranges={'EchoStatsFinder':[36,55],'Watzon':[103,123],'WellingtonTrainNetwork':[15,37],'blender-addon':[28,51],'PianoVisualiser':[5,29],'GrooveBox':[99,129],'PinterestBoardEmbedding':[100,122],'Spotify-Demographics-Analyzer':[1,26],'akahu-sheets-sync':[22,44],'metlink-departures-display':[39,65],'PowerCalculator':[22,39],'Sentient':[62,89],'personal-language-corpus':[34,58],'DadsBirthday':[151,169],'conversational-timing-lab':[1,21],'commit-reviewer':[1,32]};
const escape=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await browser.newPage({viewport:{width:1600,height:1000}});
const manifest=[];
for(const [repo,[start,end]] of Object.entries(ranges)){
 const file=selected[repo],source=await fs.readFile(path.join(assetRoot,repo,file),'utf8'),all=source.split(/\r?\n/),text=all.slice(start-1,end).join('\n');
 if(/sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]+|AIza[a-zA-Z0-9_-]{25,}/.test(text))throw Error('Potential credential in '+repo);
 const e=entries.find(e=>e.repo===repo),output=['conversational-timing-lab','commit-reviewer'].includes(repo);
 const lineRows=all.slice(start-1,end).map((line,i)=>`<div class="line"><span class="num">${start+i}</span><span>${escape(line)||' '}</span></div>`).join('');
 await p.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#e9e6e0;display:grid;place-items:center;height:100vh;font-family:system-ui}article{width:1460px;border-radius:12px;overflow:hidden;background:#1c2025;color:#e0e5eb;box-shadow:0 15px 50px #0002}header{padding:20px 32px;background:#282e35;display:flex;justify-content:space-between;color:#c7d0d9;font-size:15px}.code{padding:24px 0;font:17px/1.5 ui-monospace,SFMono-Regular,monospace}.line{display:flex;white-space:pre-wrap;overflow-wrap:anywhere}.num{flex:0 0 74px;text-align:right;padding-right:23px;color:#778390;user-select:none}.line>span:last-child{padding-right:30px;flex:1}footer{padding:17px 32px;border-top:1px solid #3a434d;font-size:13px;color:#aeb9c6}</style><article><header><span>${escape(e.title)}</span><span>${escape(file)}</span></header><div class="code">${lineRows}</div><footer>Original ${output?'recorded results':'project source'} · ${escape(file)} · lines ${start}–${end}</footer></article>`);
 const filename=repo+'-source-cover.png';await p.screenshot({path:path.join(root,filename)});
 manifest.push({repo,path:'real-media-2026-10-10/'+filename,kind:output?'original research record excerpt':'original project source excerpt',source:'Slaymish/'+repo+': '+file+' (lines '+start+' to '+end+')',sourceFile:file,lineStart:start,lineEnd:end,alt:'Original '+(output?'research record':'source code')+' from '+file+' in '+e.title+'.'});
}
await browser.close();await fs.writeFile(path.join(root,'source-covers.json'),JSON.stringify(manifest,null,2));
