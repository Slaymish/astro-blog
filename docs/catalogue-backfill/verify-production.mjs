import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@sanity/client';
import { parse } from 'node-html-parser';
const root=path.dirname(new URL(import.meta.url).pathname);
const read=async name=>JSON.parse(await fs.readFile(path.join(root,name),'utf8'));
const documents=await read('documents.json'),before=await read('existing-work.json');
const client=createClient({projectId:process.env.SANITY_PROJECT_ID||'qnuj1c4o',dataset:process.env.SANITY_DATASET||'production',apiVersion:'2024-01-01',useCdn:false,token:process.env.SANITY_API_TOKEN});
const stable=v=>JSON.stringify(v,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const assets=await read('uploaded-assets.json');
const editorial=await read('editorial.json');
const saved=await client.fetch('*[_type=="workStory"]');
const failures=[];
const removed=['alphero-voice-skill','hamish-styler'];
if(saved.length!==documents.length+before.length)failures.push('Unexpected work-story count');
for(const slug of removed)if(saved.some(d=>d.slug?.current===slug))failures.push('Removed entry still exists: '+slug);
for(const old of before){const now=saved.find(d=>d._id===old._id);if(now?._rev!==old._rev)failures.push('Existing document changed: '+old.title);}
for(const expected of documents){const actual=saved.find(d=>d._id===expected._id);if(!actual){failures.push('Missing document: '+expected.title);continue;}
 for(const key of Object.keys(expected)){
  if(key==='cover')continue;
  if(stable(expected[key])!==stable(actual[key]))failures.push(expected.title+': field differs '+key);
 }
 const repo=editorial.find(e=>e.slug===expected.slug.current)?.repo;
 if(actual.cover?.image?.asset?._ref!==assets[repo]?.assetId)failures.push(expected.title+': unexpected cover asset');
 if(actual.cover?.kind!=='image'||actual.cover?.alt!==expected.cover.alt||!actual.cover?.image?.asset?._ref?.startsWith('image-'))failures.push(expected.title+': cover differs');
}
console.log('Fresh Sanity verification:',saved.length,'work entries;',before.length,'existing revisions preserved; errors:',failures);
const deploy=process.argv[2];
const web=[];
if(deploy){
 const origin=`https://${deploy}--hamishswords.netlify.app`;
 // Small bounded batches keep source, response and image checks attributable to each page.
 for(let i=0;i<documents.length;i+=4){
  const rows=await Promise.all(documents.slice(i,i+4).map(async d=>{
   const url=origin+'/work/'+d.slug.current,response=await fetch(url),html=await response.text(),dom=parse(html);
   const errors=[];if(response.status!==200)errors.push('status '+response.status);
   if(dom.querySelector('h1')?.textContent.trim()!==d.title)errors.push('title');
   if(dom.querySelector('link[rel="canonical"]')?.getAttribute('href')!=='https://hamishburke.dev/work/'+d.slug.current)errors.push('canonical');
   if(!dom.textContent.includes(d.introduction)||!dom.textContent.includes(d.result))errors.push('copy');
   const image=dom.querySelector('main img');if(!image?.getAttribute('alt')||image.getAttribute('src')?.includes('catalogue-media'))errors.push('cover');
   else{
    const repo=editorial.find(e=>e.slug===d.slug.current)?.repo,assetId=assets[repo].assetId;
    const expectedUrl='https://cdn.sanity.io/images/qnuj1c4o/production/'+assetId.slice(6).replace(/-([^-]+)$/,'.$1');
    if(!image.getAttribute('src').startsWith(expectedUrl)||image.getAttribute('alt')!==d.cover.alt)errors.push('stale cover');
    const img=await fetch(image.getAttribute('src'),{method:'HEAD'});if(!img.ok)errors.push('cover status '+img.status);
   }
   const markdown=await fetch(url,{headers:{Accept:'text/markdown'}}),md=await markdown.text();
   if(!markdown.ok||!markdown.headers.get('content-type')?.includes('text/markdown')||!md.includes(d.title)||!md.includes(d.introduction))errors.push('markdown twin');
   return {slug:d.slug.current,status:response.status,errors};
  }));web.push(...rows);
 }
 for(const route of ['/work','/sitemap.xml','/llms.txt']){
  const r=await fetch(origin+route),body=await r.text();if(!r.ok)failures.push(route+': status '+r.status);
  for(const d of documents)if(!body.includes('/work/'+d.slug.current))failures.push(route+': missing '+d.slug.current);
 }
 for(const slug of removed){
  const r=await fetch(origin+'/work/'+slug);if(r.status!==404)failures.push('Removed page still resolves: '+slug+' ('+r.status+')');
 }
 const revision=await read('real-media-2026-10-10/result.json');
 for(const cover of revision.covers){
  for(const host of [origin,'https://hamishburke.dev']){
   const response=await fetch(host+'/work/'+cover.slug),dom=parse(await response.text()),image=dom.querySelector('main img');
   if(!image?.getAttribute('src')?.startsWith(cover.url)||image?.getAttribute('alt')!==cover.alt)failures.push(host+': old cover for '+cover.slug);
  }
 }
 const live=await fetch('https://hamishburke.dev/work'),liveBody=await live.text();
 if(!live.ok)failures.push('Apex catalogue status '+live.status);
 for(const d of documents)if(!liveBody.includes('/work/'+d.slug.current))failures.push('Apex catalogue missing '+d.slug.current);
 for(const slug of removed){if(liveBody.includes('/work/'+slug))failures.push('Removed entry still appears in live catalogue: '+slug);const r=await fetch('https://hamishburke.dev/work/'+slug);if(r.status!==404)failures.push('Removed live page still resolves: '+slug);}
 for(const row of web)if(row.errors.length)failures.push(row.slug+': '+row.errors.join(', '));
 console.log('Deploy verification:',web.length,'HTML pages, covers and negotiated Markdown; errors:',failures);
}
await fs.writeFile(path.join(root,deploy?'production-verification.json':'sanity-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),deploy:deploy||null,existingRevisionsPreserved:before.length,workStories:saved.length,pages:web,failures},null,2)+'\n');
if(failures.length)process.exitCode=1;
