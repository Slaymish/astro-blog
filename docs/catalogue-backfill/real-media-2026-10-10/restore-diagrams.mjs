import fs from 'node:fs/promises';import path from 'node:path';import {createClient} from '@sanity/client';
const root=path.dirname(new URL(import.meta.url).pathname),base=path.resolve(root,'..');
if(process.env.SANITY_WRITE_ACK!=='1')throw Error('Needs approved production acknowledgement');
const keep=new Set(['ArticulateAI','Otto','Synod','Lumen']);
const reps=JSON.parse(await fs.readFile(path.join(root,'replacement-covers.json'),'utf8'));
const before=JSON.parse(await fs.readFile(path.join(root,'before.json'),'utf8'));
const c=createClient({projectId:process.env.SANITY_PROJECT_ID,dataset:'production',apiVersion:'2024-01-01',useCdn:false,token:process.env.SANITY_API_TOKEN});
const now=await c.fetch('*[_type=="workStory"]');
const previous=JSON.parse(await fs.readFile(path.join(root,'result.json'),'utf8'));
await fs.writeFile(path.join(root,'broader-update-result.json'),JSON.stringify(previous,null,2));
let tx=c.transaction();const restore=previous.covers.filter(r=>!keep.has(r.repo));
for(const row of restore){const old=before.find(d=>d._id===row.id),current=now.find(d=>d._id===row.id);tx=tx.patch(row.id,p=>p.ifRevisionId(current._rev).set({cover:old.cover}));}
await tx.commit();
const after=await c.fetch('*[_type=="workStory"]');for(const row of restore){if(JSON.stringify(after.find(d=>d._id===row.id).cover)!==JSON.stringify(before.find(d=>d._id===row.id).cover))throw Error('Restore failed '+row.repo);}
await fs.writeFile(path.join(root,'replacement-covers.json'),JSON.stringify(reps.filter(r=>keep.has(r.repo)),null,2));
await fs.writeFile(path.join(root,'result.json'),JSON.stringify({...previous,changedAt:new Date().toISOString(),covers:previous.covers.filter(r=>keep.has(r.repo)),otherRevisionsPreserved:23,diagramsRestored:19},null,2));
const uploaded=JSON.parse(await fs.readFile(path.join(base,'uploaded-assets.json'),'utf8'));for(const row of restore){uploaded[row.repo].assetId=before.find(d=>d._id===row.id).cover.image.asset._ref;}
await fs.writeFile(path.join(base,'uploaded-assets.json'),JSON.stringify(uploaded,null,2));
console.log('Restored all 19 explanatory covers; retained only the four requested replacements.');
