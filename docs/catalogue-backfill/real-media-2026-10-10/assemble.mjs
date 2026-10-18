import fs from 'node:fs/promises';import path from 'node:path';import sharp from 'sharp';
const root=path.dirname(new URL(import.meta.url).pathname),base=path.resolve(root,'..');
const sources=JSON.parse(await fs.readFile(path.join(root,'source-covers.json'),'utf8'));
const additions=[
{repo:'ArticulateAI',file:'articulate-cover.png',kind:'original command menu capture',source:'Slaymish/ArticulateAI run.py, executed to its first prompt with audio/API imports disabled.',alt:'Original ArticulateAI command menu, with twelve options for processing a spoken transcript.'},
{repo:'Otto',file:'otto-cover.png',kind:'original native interface render',source:'Unmodified JournalView in Otto/Otto/JournalWindow.swift, rendered offline using shipped memory/capabilities.json. No microphone, model, commands or learning run.',alt:'Otto’s native capability journal rendered with the original shipped app and music commands, in an offline demonstration.'},
{repo:'Synod',file:'synod-cover.png',kind:'original plugin interface render',source:'Unmodified src/ui/status-view.ts and styles.css rendered in an offline DOM host. Empty demonstration state; no vault content or model calls.',alt:'Synod’s original plugin status view rendered offline, showing its journal import, value discovery and bulletin controls.'},
{repo:'Lumen',file:'lumen-cover.png',kind:'original plugin interface render',source:'Unmodified obsidian-plugin/src/research/index.ts and styles.css rendered in an offline DOM host. Empty demonstration state; no research run.',alt:'Lumen’s original research form rendered offline, showing question input, sub-questions, vault and web sources, and memory controls.'},
{repo:'PlatformerGame',file:'platformer-cover.png',kind:'preserved game export screenshot',source:'Original Godot web export in HTML/Assignment-1-godot.html, run locally with its original WASM and PCK assets.',alt:'Screenshot of the preserved Cookie Cat platformer web export, showing the original game graphics.'},
{repo:'YayMinecraftServer',file:'minecraft-cover.png',kind:'original landing page screenshot',source:'Original infra/site/index.html rendered locally. Server status was unavailable during capture; no access request submitted.',alt:'Original Minecraft server landing page, showing the server address, whitelist access form and connection guidance.'},
{repo:'WeddingWebsite',file:'wedding-cover.png',kind:'original project artwork',source:'Original wedding-site/src/assets/images/flower_header.webp, recovered from the repository.',alt:'Original floral header artwork from the wedding website.'}
];
// The original native view is composited into a cover with a factual capture caption.
const shot=await sharp(path.join(root,'otto-interface.png')).resize({width:1000}).png().toBuffer();
const caption=Buffer.from('<svg width="1400" height="70"><text x="0" y="27" font-family="Arial" font-size="22" fill="#333">Otto · original SwiftUI capability journal</text><text x="0" y="56" font-family="Arial" font-size="15" fill="#666">Offline render with shipped capabilities · no learned sessions or model calls</text></svg>');
await sharp({create:{width:1600,height:1050,channels:3,background:'#e9e6e0'}}).composite([{input:shot,left:300,top:40},{input:caption,left:100,top:940}]).png().toFile(path.join(root,'otto-cover.png'));
await sharp('/Users/hamishburke/Documents/Codex/project-media-2026-10-10/assets/WeddingWebsite/wedding-site/src/assets/images/flower_header.webp').resize(1600,1000,{fit:'contain',background:'#faf7f1'}).png().toFile(path.join(root,'wedding-cover.png'));
for(const a of additions){sources.push({...a,path:'real-media-2026-10-10/'+a.file});}
for(const a of sources){const m=await sharp(path.join(base,a.path)).metadata();a.width=m.width;a.height=m.height;a.capturedAt=new Date().toISOString();}
await fs.writeFile(path.join(root,'replacement-covers.json'),JSON.stringify(sources,null,2));
const comps=[];for(let i=0;i<sources.length;i++){const x=(i%4)*400,y=Math.floor(i/4)*280;const thumb=await sharp(path.join(base,sources[i].path)).resize(390,240,{fit:'contain',background:'#e9e6e0'}).png().toBuffer();comps.push({input:thumb,left:x,top:y});const label=Buffer.from(`<svg width="390" height="35"><text x="6" y="24" font-family="Arial" font-size="16">${sources[i].repo}</text></svg>`);comps.push({input:label,left:x,top:y+240});}
await sharp({create:{width:1600,height:1680,channels:3,background:'#e9e6e0'}}).composite(comps).png().toFile(path.join(root,'replacement-sheet.png'));
console.log(sources.length,'real project replacements');
