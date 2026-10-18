import json,subprocess,concurrent.futures,base64
from pathlib import Path
root=Path('/Users/hamishburke/Documents/Codex/project-media-2026-10-10');audit=Path('/Users/hamishburke/Documents/Codex/github-catalog-2026-10-10')
selected={
'EchoStatsFinder':'functions/base/vrmlplayersearcher.py','Watzon':'app/src/main/java/vrml/api/Bot.java','conversational-timing-lab':'results/e1_ami_3meetings.txt','commit-reviewer':'experiments/FINDINGS.md','WellingtonTrainNetwork':'src/main/java/AStar.java','blender-addon':'addon/Addon/floor_importer.py','PianoVisualiser':'piano.cpp','GrooveBox':'host/engine/groovebox/sequencer.py','PinterestBoardEmbedding':'cluster_images.py','Spotify-Demographics-Analyzer':'analysis.py','akahu-sheets-sync':'src/bank_sync/reconciliation.py','metlink-departures-display':'bus_sign_server.py','PowerCalculator':'src/calc.ts','YayMinecraftServer':'infra/site/index.html','Sentient':'Environment2D.py','personal-language-corpus':'language_corpus/quantitative.py','DadsBirthday':'app.js','WeddingWebsite':'wedding-site/src/assets/images/flower_header.webp'}
tasks=list(selected.items())
s=json.load(open(audit/'scans/PlatformerGame.json'))
tasks += [('PlatformerGame',x['path']) for x in s['tree']['tree'] if x['type']=='blob' and x['path'].startswith('HTML/') and not x['path'].endswith('.import')]
def fetch(task):
 repo,p=task;dest=root/'assets'/repo/p;dest.parent.mkdir(parents=True,exist_ok=True)
 tree=json.load(open(audit/'scans'/(repo+'.json')))['tree']['tree']
 blob=next(x for x in tree if x['path']==p)
 if dest.exists() and dest.stat().st_size==blob['size']:return repo,p,'existing'
 raw=subprocess.check_output(['gh','api','repos/Slaymish/'+repo+'/git/blobs/'+blob['sha']])
 data=json.loads(raw);dest.write_bytes(base64.b64decode(data['content']))
 return repo,p,dest.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for item in pool.map(fetch,tasks):print(*item)
Path('docs/catalogue-backfill/real-media-2026-10-10/selected-files.json').write_text(json.dumps(selected,indent=2))
