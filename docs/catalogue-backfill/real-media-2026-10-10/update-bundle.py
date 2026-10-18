import json
from pathlib import Path
root=Path(__file__).resolve().parent;base=root.parent
replacements=json.loads((root/'replacement-covers.json').read_text())
# Keep past image generation records as history; none remain selected in this bundle.
p=base/'covers.mjs';s=p.read_text();old="for (const repo of ['ArticulateAI','Lumen','Synod']) sources.push({repo,path:'media/'+repo+'.png',kind:'AI-generated conceptual illustration',source:'Built-in imagegen; prompts in image-prompts.md'});"
s=s.replace(old,"sources.push(...JSON.parse(await fs.readFile(path.join(root,'real-media-2026-10-10/replacement-covers.json'),'utf8')));")
p.write_text(s)
p=base/'entries.py';s=p.read_text();marker='\n# Covers recovered from real project media, October 2026.\n'
if marker in s:s=s[:s.index(marker)]
s+=marker+'_REAL_COVER_ALTS = '+repr({c['repo']:c['alt'] for c in replacements})+'\nfor _entry in ENTRIES:\n    if _entry["repo"] in _REAL_COVER_ALTS:\n        _entry["coverAlt"] = _REAL_COVER_ALTS[_entry["repo"]]\n'
p.write_text(s)
