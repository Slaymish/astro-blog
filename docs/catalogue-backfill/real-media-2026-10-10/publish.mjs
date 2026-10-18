import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {createClient} from '@sanity/client';
if(process.env.SANITY_WRITE_ACK!=='1')throw Error('Approved production updates require SANITY_WRITE_ACK=1');
const root=path.dirname(new URL(import.meta.url).pathname),base=path.resolve(root,'..');
const replacements=JSON.parse(await fs.readFile(path.join(root,'replacement-covers.json'),'utf8'));
const docs=JSON.parse(await fs.readFile(path.join(base,'documents.json'),'utf8'));
const entries=JSON.parse(await fs.readFile(path.join(base,'editorial.json'),'utf8'));
const c=createClient({projectId:process.env.SANITY_PROJECT_ID,dataset:process.env.SANITY_DATASET||'production',apiVersion:'2024-01-01',useCdn:false,token:process.env.SANITY_API_TOKEN});
const before=await c.fetch('*[_type=="workStory"]');
if(before.length!==46)throw Error('Unexpected catalogue count');
await fs.writeFile(path.join(root,'before.json'),JSON.stringify(before,null,2));
const changed=[];let tx=c.transaction();const uploaded=JSON.parse(await fs.readFile(path.join(base,'uploaded-assets.json'),'utf8'));
for(const rep of replacements){
 const expected=docs.find(d=>d.slug.current===entries.find(e=>e.repo===rep.repo).slug);
 const old=before.find(d=>d._id===expected._id);if(!old)throw Error('Missing document '+rep.repo);
 const buffer=await fs.readFile(path.join(base,rep.path));
 const asset=await c.assets.upload('image',buffer,{filename:rep.repo+'-original-project-cover.png',label:rep.repo+' original project cover',description:rep.source});
 tx=tx.patch(old._id,p=>p.ifRevisionId(old._rev).set({'cover.image':{_type:'image',asset:{_type:'reference',_ref:asset._id}},'cover.alt':rep.alt}));
 changed.push({repo:rep.repo,slug:expected.slug.current,id:old._id,assetId:asset._id,url:asset.url,alt:rep.alt,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
 uploaded[rep.repo]={assetId:asset._id,sha256:changed.at(-1).sha256};
}
await tx.commit();const after=await c.fetch('*[_type=="workStory"]');
const ids=new Set(changed.map(d=>d.id));for(const old of before){const now=after.find(d=>d._id===old._id);if(!now)throw Error('Lost entry '+old.title);if(!ids.has(old._id)&&old._rev!==now._rev)throw Error('Unrelated document changed '+old.title);for(const k of Object.keys(old).filter(k=>!['cover','_rev','_updatedAt'].includes(k)))if(JSON.stringify(old[k])!==JSON.stringify(now[k]))throw Error('Non-cover field changed '+old.title+' '+k);}
if(after.length!==before.length)throw Error('Count changed');
const result={changedAt:new Date().toISOString(),covers:changed,workStories:after.length,otherRevisionsPreserved:before.length-changed.length};
await fs.writeFile(path.join(root,'result.json'),JSON.stringify(result,null,2));await fs.writeFile(path.join(base,'uploaded-assets.json'),JSON.stringify(uploaded,null,2));
console.log('Updated',changed.length,'covers;',after.length,'entries;',result.otherRevisionsPreserved,'other revisions preserved; all copy/dates preserved.');
