import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.dirname(new URL(import.meta.url).pathname);
const entries=JSON.parse(await fs.readFile(path.join(root,'preview-stories.json'),'utf8'));
const sources=JSON.parse(await fs.readFile(path.join(root,'sources.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tokenCss=await fs.readFile(path.resolve(root,'../../src/styles/tokens.css'),'utf8');
let cards='', markdown='# Thirty-eight prepared catalogue entries\n\nAll dates use the recorded first preserved commit or release, rather than an assumed launch. Current application screenshots were captured in October 2026. The thirty-eight-entry bundle is published in the live catalogue at https://hamishburke.dev/work.\n\n';
for(const e of [...entries].sort((a,b)=>b.date.localeCompare(a.date))){
 const s=sources.find(s=>s.slug===e.slug);
 cards+=`<article><a href="/work/${esc(e.slug)}"><img src="${esc(e.cover.image.asset.url)}" alt="${esc(e.cover.alt)}" loading="lazy"></a><div><small>${esc(e.timeframe)} · ${esc(s.dateBasis)} · ${esc(e.kind)}</small><h2><a href="/work/${esc(e.slug)}">${esc(e.title)}</a></h2><p>${esc(e.summary)}</p><details><summary>Copy, date evidence and media source</summary><p>${esc(e.introduction)}</p><p>${esc(e.role)}</p>${e.body.map(b=>'<p>'+esc(b.children.map(c=>c.text).join(''))+'</p>').join('')}<p><strong>Result:</strong> ${esc(e.result)}</p><p>Archive date: ${esc(e.date)}. <a href="${esc(s.milestone.url)}">Original ${esc(s.dateBasis)}</a>${s.milestonePrivate?' (private source)':''}.</p><p>Cover: ${esc(s.cover.kind)}. ${esc(s.cover.source)}</p></details></div></article>`;
 markdown+=`## ${e.title}\n\n${e.date} · ${e.timeframe} · ${e.kind}\n\n${e.descriptor}\n\n${e.summary}\n\n${e.introduction}\n\n${e.role}\n\n${e.body.map(b=>b.children.map(c=>c.text).join('')).join('\n\n')}\n\nResult: ${e.result}\n\nDate evidence: [${s.dateBasis}](${s.milestone.url})${s.milestonePrivate?' (private repository)':''}.\n\nCover: ${s.cover.kind}. ${s.cover.source}\n\n[Local preview](http://localhost:4371/work/${e.slug})\n\n`;
}
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Thirty-eight catalogue additions</title><style>${tokenCss}body{background:var(--color-paper-0);color:var(--color-ink-100);font-family:system-ui,sans-serif;margin:0;padding:3rem;line-height:1.6}main{max-width:1200px;margin:auto}a{color:inherit}header{margin-bottom:3rem}h1{font-size:3rem;line-height:1.1}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem}article{border:1px solid var(--color-line-200);border-radius:12px;overflow:hidden}article>div{padding:1.5rem}img{width:100%;height:260px;object-fit:contain;background:var(--color-paper-50)}small{color:var(--color-ink-500)}h2{margin:.6rem 0}summary{cursor:pointer}details{overflow-wrap:anywhere}details p{font-size:.95rem}@media(max-width:700px){body{padding:1rem}section{grid-template-columns:1fr}h1{font-size:2rem}}</style><main><header><h1>Thirty-eight catalogue additions</h1><p>Complete entries for the approved shortlist, with historical date evidence and covers. Existing work stays in place.</p><p><a href="/work">Open the combined site catalogue</a> · 19 recovered assets, screenshots or original interface renders · 19 explanatory diagrams</p><p>Dates record a preserved commit or release, and are explained on each page. Current application screenshots were captured in October 2026. This local preview does not publish anything.</p></header><section>${cards}</section></main></html>`;
await fs.writeFile(path.join(root,'review.html'),html.replaceAll('href="/','href="http://localhost:4371/').replaceAll('src="/catalogue-media/','src="media/'));await fs.writeFile(path.join(root,'review.md'),markdown);
const preview='/Users/hamishburke/Documents/Codex/catalogue-preview-2026-10-10';await fs.writeFile(path.join(preview,'catalogue-review.html'),html);
for(let page=0;page<2;page++){
 const composites=[];
 for(let j=0;j<20;j++){
  const idx=page*20+j;if(idx>=sources.length)continue;const s=sources[idx],x=j%4*400,y=Math.floor(j/4)*255;
  const b=await sharp(path.join(root,s.cover.path)).resize(390,210,{fit:'contain',background:'rgb(248,245,240)'}).png().toBuffer();composites.push({input:b,left:x,top:y});
  const label=`<svg width="390" height="40"><text x="6" y="22" font-family="Arial" font-size="15" fill="rgb(30,30,30)">${esc(entries[idx].title)} · ${s.date}</text></svg>`;composites.push({input:Buffer.from(label),left:x,top:y+210});
 }
 await sharp({create:{width:1600,height:1275,channels:3,background:'rgb(248,245,240)'}}).composite(composites).png().toFile(path.join(root,`cover-sheet-${page+1}.png`));
}
console.log('Review gallery, full copy document and two 20-cover sheets written.');
