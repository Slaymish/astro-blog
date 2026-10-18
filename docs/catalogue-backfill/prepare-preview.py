"""Isolated site build, overlaying prepared documents without any Sanity mutation."""
import pathlib, shutil, json
root=pathlib.Path(__file__).resolve().parents[2]
out=pathlib.Path('/Users/hamishburke/Documents/Codex/catalogue-preview-2026-10-10')
out.mkdir(exist_ok=True,parents=True)
for name in ['src','public','scripts','tests','netlify','studio']:
 shutil.copytree(root/name,out/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('node_modules','dist','.git','.netlify'))
for name in ['astro.config.ts','tsconfig.json','package.json','pnpm-lock.yaml','knip.json','netlify.toml','.gitignore','pnpm-workspace.yaml']:
 shutil.copy2(root/name,out/name)
if not (out/'node_modules').exists(): (out/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
entries=json.loads((root/'docs/catalogue-backfill/preview-stories.json').read_text())
(out/'src/content/catalogue-preview.json').write_text(json.dumps(entries))
media=out/'public/catalogue-media';media.mkdir(exist_ok=True)
for s in json.loads((root/'docs/catalogue-backfill/sources.json').read_text()): shutil.copy2(root/'docs/catalogue-backfill'/s['cover']['path'],media)
p=out/'src/content/sanity.ts'
s=p.read_text().replace("import { createClient }", "import stories from './catalogue-preview.json';\nimport { createClient }")
start=s.index('export const fetchSanity')
s=s[:start]+'''async function fetchWithPreview<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  const remote = await sanity.fetch(query, params, { useCdn: false });
  if (query.includes('_type == "workStory"') && Array.isArray(remote)) return [...remote, ...stories].sort((a,b) => a.order-b.order) as T;
  if (query.includes('_type in ["post", "report", "workStory"]') && Array.isArray(remote)) {
    return [...remote,...stories.map(s=>({_type:'workStory',title:s.title,slug:s.slug,publishedAt:s.date,excerpt:s.summary,tags:s.tags}))].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,50) as T;
  }
  return remote as T;
}
export const fetchSanity = fetchWithPreview;
export const fetchFreshSanity = fetchWithPreview;
'''
p.write_text(s)
p=out/'src/content/images.ts';s=p.read_text().replace('  const builder = builderFor(assetUrl);','''  if (assetUrl.startsWith('/catalogue-media/')) return {src:assetUrl,srcset:`${assetUrl} ${intrinsicWidth}w`,width:intrinsicWidth,height:intrinsicHeight};
  const builder = builderFor(assetUrl);''');p.write_text(s)
print(out)
