"""Build the reviewable, additive Sanity bundle from the evidenced editorial sources."""
import json, pathlib, datetime, importlib.util
ROOT=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('entries',ROOT/'entries.py'); module=importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
entries=module.ENTRIES
history={x['repo']:x for x in json.loads((ROOT/'history.json').read_text())}
covers={x['repo']:x for x in json.loads((ROOT/'covers.json').read_text())}
existing=json.loads((ROOT/'existing-work.json').read_text())
next_order=max(x['order'] for x in existing)+1
original_bundle=ROOT/'revision-2026-10-10/original-documents.json'
original_orders={x['_id']:x['order'] for x in json.loads(original_bundle.read_text())} if original_bundle.exists() else {}
sources=[]; docs=[]; previews=[]
def block(text,key,style='normal'):
 return {'_type':'block','_key':key,'style':style,'markDefs':[],'children':[{'_type':'span','_key':key+'-text','text':text,'marks':[]}]}
for i,e in enumerate(entries):
 h=history[e['repo']]; milestone=h['firstCommit']; basis='first preserved commit'
 if e['repo'] in ['EchoStatsFinder','3dSpanningTrees','AndoSim','Synod','Lumen','Otto'] and h['releases']:
  milestone=min(h['releases'],key=lambda x:x['date']); basis='first preserved release'
 if e['repo']=='Watzon': milestone=json.loads((ROOT/'watzon-earlier-history.json').read_text())
 date=milestone['date'][:10]; dt=datetime.date.fromisoformat(date); timeframe=dt.strftime('%B %Y')
 if e['repo']=='Watzon': timeframe='June to July 2022'
 if e['repo']=='grid-diffusion-ad': timeframe='November 2025 to February 2026'
 if e['repo']=='WeddingWebsite': timeframe='October 2023 to October 2024'
 if e['repo']=='PlatformerGame': timeframe='July to August 2023'
 e.update(date=date,timeframe=timeframe)
 note='The catalogue date follows the '+basis+' on '+str(dt.day)+' '+dt.strftime('%B %Y')+'.'
 cover=covers[e['repo']]
 links=[]
 if not h['private']: links.append({'_key':'source','label':'Source code','href':'https://github.com/Slaymish/'+e['repo'],'external':True,'kind':'source'})
 if e['repo']=='BusRouter': links.append({'_key':'router','label':'Routing service source','href':'https://github.com/Slaymish/transitsync-routing','external':True,'kind':'source'})
 if e['repo']=='Otto': links.append({'_key':'upstream','label':'Original voice-os project','href':'https://github.com/per-simmons/voice-os','external':True,'kind':'other'})
 if e['repo']=='AndoSim': links.append({'_key':'paper','label':'Underlying research paper','href':'https://doi.org/10.1145/3687908','external':True,'kind':'other'})
 if e['repo']=='PlatformerGame': links.append({'_key':'demo','label':'Recorded gameplay','href':'https://www.youtube.com/watch?v=c5CPZju70HY','external':True,'kind':'other'})
 if e['repo'] in ['BedroomLayoutDesigner','PianoImprovisationHelper','dropeta']:
  links.append({'_key':'app','label':'Open the application','href':cover['source'],'external':True,'kind':'other'})
 paragraphs=[block(p,'paragraph-'+str(j)) for j,p in enumerate(e['paragraphs'])]
 paragraphs.append(block(note,'archive-date'))
 if e['repo']=='AndoSim': paragraphs.append(block('The cover is the teaser collage included with the repository, illustrating the published simulation method rather than a separately verified run of my add-on.','cover-credit'))
 d={k:e[k] for k in ['title','descriptor','kind','date','timeframe','summary','introduction','role','result','tags']}
 d.update(_id='catalogue-backfill-'+e['slug'],_type='workStory',slug={'_type':'slug','current':e['slug']},order=original_orders.get('catalogue-backfill-'+e['slug'],next_order+i),body=paragraphs,links=links,cover={'_type':'object','kind':'image','alt':cover['alt'],'image':{'_type':'image','asset':{'_type':'reference','_ref':'LOCAL-COVER:'+e['repo']}}},evidence=[],artifacts=[],related=[])
 docs.append(d)
 preview=json.loads(json.dumps(d));preview['slug']=e['slug'];preview['updatedAt']='2026-10-10T00:00:00Z';preview['cover']['image']['asset']={'_id':'local-'+e['repo'],'url':'/catalogue-media/'+pathlib.Path(cover['path']).name,'width':cover['width'],'height':cover['height']};previews.append(preview)
 sources.append({'repo':e['repo'],'slug':e['slug'],'privateSource':h['private'],'date':date,'timeframe':timeframe,'dateBasis':basis,'milestone':milestone,'milestonePrivate':h['private'] or e['repo']=='Watzon','originalCommit':h['firstCommit'],'cover':cover})
for name,data in [('editorial.json',entries),('documents.json',docs),('preview-stories.json',previews),('sources.json',sources)]: (ROOT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
assert len(docs)==38
assert len({d['_id'] for d in docs})==38
assert not {d['slug']['current'] for d in docs}&{x['slug']['current'] for x in existing}
for d in docs:
 for key,limit in {'title':80,'descriptor':60,'timeframe':60,'summary':180,'introduction':320,'role':180,'result':280}.items(): assert len(d[key])<=limit,(d['title'],key,len(d[key]))
 assert len(d['cover']['alt'])<=240
 text=' '.join(d[k] for k in ['title','descriptor','summary','introduction','role','result'])+' '.join(c['text'] for b in d['body'] for c in b['children'])
 assert not any(c in text for c in ['—','–',';','!','?','"']),d['title']
print('Built and checked',len(docs),'complete entries with evidence-backed dates.')
