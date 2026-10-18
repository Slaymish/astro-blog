import base64, concurrent.futures, datetime, json, pathlib, re, subprocess, urllib.parse, urllib.request

ROOT=pathlib.Path(__file__).resolve().parent
AUDIT=pathlib.Path('/Users/hamishburke/Documents/Codex/github-catalog-2026-10-10')
NAMES='EchoStatsFinder Watzon ArticulateAI LSystemGenerator 3dSpanningTrees BlenderBookShelf PlatformerGame WeddingWebsite DadsBirthday BusRouter AndoSim BedroomLayoutDesigner PianoImprovisationHelper Synod Lumen Otto grid-diffusion-ad conversational-timing-lab commit-reviewer MalwareResearchPaper CYBRAnalysis Musicical-Genre-Classifier WellingtonTrainNetwork CGRA251_Framework_A4 CGRA354_Framework_A3 CGRA350-Assignment-1 blender-addon PianoVisualiser GrooveBox PinterestBoardEmbedding Spotify-Demographics-Analyzer akahu-sheets-sync metlink-departures-display PowerCalculator YayMinecraftServer Sentient dropeta HamishStyler alphero-voice personal-language-corpus'.split()
repos={r['name']:r for r in json.loads((AUDIT/'repos.json').read_text())}
def gh(path, headers=False):
 p=subprocess.run(['gh','api']+(['-i'] if headers else [])+[path],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(p.stderr[:300])
 if headers:
  h,b=p.stdout.split('\n\n',1);return h,json.loads(b)
 return json.loads(p.stdout)
def collect(n):
 r=repos[n];h,commits=gh('repos/Slaymish/'+n+'/commits?per_page=100',True)
 last=re.search(r'<([^>]+)>; rel="last"',h)
 if last:commits=gh(last.group(1))
 original=[c for c in commits if (c.get('author') or {}).get('login','').lower()=='slaymish']
 original=original or commits
 first=sorted(original,key=lambda c:c['commit']['author']['date'])[0]
 release=gh('repos/Slaymish/'+n+'/releases?per_page=100')
 releases=[x for x in release if not x['draft'] and x.get('published_at')]
 row={'repo':n,'private':r['private'],'branch':r['default_branch'],'createdAt':r['created_at'],'pushedAt':r['pushed_at'],'firstCommit':{'sha':first['sha'],'date':first['commit']['author']['date'],'message':first['commit']['message'].split('\n')[0],'url':first['html_url']},'releases':[{'tag':x['tag_name'],'date':x['published_at'],'url':x['html_url'],'assets':[{'name':a['name'],'url':a['browser_download_url']} for a in x['assets']]} for x in releases]}
 (ROOT/'history').mkdir(exist_ok=True);(ROOT/'history'/(n+'.json')).write_text(json.dumps(row,indent=2))
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 history=list(pool.map(collect,NAMES))
(ROOT/'history.json').write_text(json.dumps(history,indent=2))
for x in history:print(x['repo'],x['firstCommit']['date'][:10],x['firstCommit']['message'],flush=True)

media={
 'AndoSim':'docs/example_images/teaser-image.jpg',
 'CGRA251_Framework_A4':'work/res/samples/challenge_1.png',
 'CGRA354_Framework_A3':'images/challenge.png',
 'CGRA350-Assignment-1':'work/res/results/screenshot_1722679703546.png',
 'Musicical-Genre-Classifier':'images/heatmap.png',
 'MalwareResearchPaper':'clean_tuned_ASR_comparison.png',
 'CYBRAnalysis':'cowrie-log-analysis/notebooks/visualizations/temporal_patterns.png',
 'Otto':'Otto/Otto/AppIcon.png',
 'BusRouter':'logo_name.PNG',
 'grid-diffusion-ad':next(x['path'] for x in json.loads((AUDIT/'scans/grid-diffusion-ad.json').read_text())['tree']['tree'] if x['path'].endswith('reconstruction_fidelity_examples.png')),
}
def download(pair):
 n,path=pair;d=gh('repos/Slaymish/'+n+'/contents/'+urllib.parse.quote(path,safe='/'))
 raw=base64.b64decode(d.get('content',''))
 if not raw:raw=urllib.request.urlopen(d['download_url']).read()
 dest=ROOT/'media'/(n+pathlib.Path(path).suffix.lower());dest.parent.mkdir(exist_ok=True);dest.write_bytes(raw)
 return {'repo':n,'path':str(dest.relative_to(ROOT)),'source':'https://github.com/Slaymish/'+n+'/blob/'+repos[n]['default_branch']+'/'+urllib.parse.quote(path,safe='/'),'kind':'original project asset'}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 assets=list(pool.map(download,media.items()))
for n in ['LSystemGenerator','3dSpanningTrees','BlenderBookShelf']:
 readme=json.loads((AUDIT/'scans'/(n+'.json')).read_text())['readme']
 urls=re.findall(r'https://github.com/Slaymish/[^\s"<>)]*/assets/[^\s"<>)]*',readme)
 if urls:
  try:
   raw=urllib.request.urlopen(urls[0]).read();dest=ROOT/'media'/(n+'.png');dest.write_bytes(raw)
   assets.append({'repo':n,'path':str(dest.relative_to(ROOT)),'source':urls[0],'kind':'original README example'})
  except Exception as e:print('README image unavailable:',n,str(e)[:200])
(ROOT/'media-sources.json').write_text(json.dumps(assets,indent=2))
print('Original media:',len(assets),flush=True)
