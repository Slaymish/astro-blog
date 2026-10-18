/** Additive import. Default is read-only. Production writes require explicit approval and SANITY_WRITE_ACK=1. */
import { createClient } from '@sanity/client';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { validateWorkStories } from '../../src/content/validate';
import type { WorkStory } from '../../src/content/types';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=async(name:string)=>JSON.parse(await readFile(path.join(root,name),'utf8'));
const documents=await read('documents.json');
const preview=await read('preview-stories.json') as WorkStory[];
const sources=await read('sources.json');
const client=createClient({projectId:process.env.SANITY_PROJECT_ID||'qnuj1c4o',dataset:process.env.SANITY_DATASET||'production',apiVersion:'2024-01-01',useCdn:false,token:process.env.SANITY_API_TOKEN,perspective:'raw'});
const existing=await client.fetch('*[_type == "workStory"]{...,"slug":slug.current,"cover":cover{...,image{...,asset->{_id,url,"width":metadata.dimensions.width,"height":metadata.dimensions.height}}},"evidence":evidence[]{...,image{...,asset->{_id,url}}}}');
const ids=new Set(documents.map((d:any)=>d._id));
const others=existing.filter((d:any)=>!ids.has(d._id));
const errors=validateWorkStories([...others,...preview]);
if(documents.length!==38)errors.push('Expected exactly 38 entries');
for(const d of documents){
 const collide=existing.find((x:any)=>x.slug===d.slug.current&&x._id!==d._id);
 if(collide)errors.push('Slug collision: '+d.slug.current);
 for(const [field,max] of Object.entries({title:80,descriptor:60,timeframe:60,summary:180,introduction:320,role:180,result:280}))if(d[field].length>max)errors.push(d.title+': '+field+' too long');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date))errors.push(d.title+': invalid date');
 const source=sources.find((s:any)=>s.slug===d.slug.current);
 if(source.privateSource&&d.links.some((l:any)=>l.href.startsWith('https://github.com/Slaymish/'+source.repo)))errors.push(d.title+': private repository linked');
 await readFile(path.join(root,source.cover.path));
}
if(errors.length)throw Error(errors.join('\n'));
console.log('Validated 38 entries, 38 media files and '+others.length+' preserved existing stories. No collisions.');
await writeFile(path.join(root,'validation.json'),JSON.stringify({checkedAt:new Date().toISOString(),entries:38,covers:38,existingStories:others.length,errors},null,2)+'\n');
if(!process.argv.includes('--publish')){console.log('Read-only dry run. No assets or documents written to Sanity.');process.exit(0);}
if(process.env.SANITY_WRITE_ACK!=='1')throw Error('Production import requires explicit user approval and SANITY_WRITE_ACK=1.');
if(!process.env.SANITY_API_TOKEN)throw Error('SANITY_API_TOKEN is required for the approved import.');
let uploaded:Record<string,{assetId:string,sha256:string}>={};
try{uploaded=await read('uploaded-assets.json');}catch(error:any){if(error.code!=='ENOENT')throw error;}
const stable=(value:any):string=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
// Resolve and compare existing backfill documents before any upload or mutation.
for(const d of documents){
 const hit=existing.find((x:any)=>x._id===d._id);
 if(hit){
  const raw=await client.getDocument(d._id);
  const expected={...d,cover:{...d.cover,image:{...d.cover.image,asset:raw?.cover?.image?.asset}}};
  for(const key of Object.keys(expected))if(stable(raw?.[key])!==stable(expected[key]))throw Error('Existing backfill differs: '+d._id+'. Refusing to overwrite.');
 }
}
for(const source of sources){
 const bytes=await readFile(path.join(root,source.cover.path));
 const sha256=createHash('sha256').update(bytes).digest('hex');
 if(uploaded[source.repo]?.sha256===sha256&&await client.getDocument(uploaded[source.repo].assetId))continue;
 const asset=await client.assets.upload('image',bytes,{filename:path.basename(source.cover.path),label:source.repo+' portfolio cover',description:source.cover.kind+'. '+(source.privateSource?'Project visual from the private source archive.':source.cover.source)});
 uploaded[source.repo]={assetId:asset._id,sha256};
 await writeFile(path.join(root,'uploaded-assets.json'),JSON.stringify(uploaded,null,2)+'\n');
}
let transaction=client.transaction();
for(const d of documents){
 const source=sources.find((s:any)=>s.slug===d.slug.current);
 const complete={...d,cover:{...d.cover,image:{...d.cover.image,asset:{_type:'reference',_ref:uploaded[source.repo].assetId}}}};
 transaction=transaction.createIfNotExists(complete);
}
await transaction.commit();
const saved=await client.fetch('*[_id in $ids]{_id,title,"slug":slug.current,cover{image{asset->{url}}}}',{ids:[...ids]});
if(saved.length!==38||saved.some((x:any)=>!x.cover?.image?.asset?.url))throw Error('Post-import verification failed');
await writeFile(path.join(root,'import-result.json'),JSON.stringify({importedAt:new Date().toISOString(),stories:saved},null,2)+'\n');
console.log('All 38 documents present with image assets. Existing work documents were not modified.');
