import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.dirname(new URL(import.meta.url).pathname);
const entries=JSON.parse(await fs.readFile(path.join(root,'editorial.json'),'utf8'));
const css=await fs.readFile(path.resolve(root,'../../src/styles/tokens.css'),'utf8');
const token=(name)=>{const hex=css.match(new RegExp(name+':\\s*(#[0-9a-f]+)','i'))?.[1];if(!hex)throw Error(name);return 'rgb('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')+')';};
const C={paper:token('--color-paper-0'),inset:token('--color-paper-50'),ink:token('--color-ink-100'),muted:token('--color-ink-500'),line:token('--color-line-200'),accent:token('--color-signal-700')};
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const txt=(x,y,s,size=22,fill=C.ink,extra='')=>`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`;
const line=(x1,y1,x2,y2,fill=C.line,w=2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${w}"/>`;
const box=(x,y,w,h,fill=C.inset)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${C.line}" stroke-width="2"/>`;
const dot=(x,y,r=8,fill=C.accent)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
let sources=JSON.parse(await fs.readFile(path.join(root,'media-sources.json'),'utf8'));
const shots=JSON.parse(await fs.readFile(path.join(root,'screenshots.json'),'utf8'));sources=[...sources,...shots];
sources.push(...JSON.parse(await fs.readFile(path.join(root,'real-media-2026-10-10/replacement-covers.json'),'utf8')));
const originals=new Map(sources.map(s=>[s.repo,s]));
const output=[];
for(const e of entries){
 const found=originals.get(e.repo);
 if(found){
  const metadata=await sharp(path.join(root,found.path)).metadata();
  output.push({...found,width:metadata.width,height:metadata.height,alt:e.coverAlt||'Project visual for '+e.title});
  continue;
 }
 let art='';
 const mode=e.repo==='Sentient'?'world':e.repo==='PianoVisualiser'?'wave':e.repo==='GrooveBox'?'sequencer':e.repo==='PinterestBoardEmbedding'?'clusters':e.repo==='WellingtonTrainNetwork'?'network':e.repo==='DadsBirthday'?'gallery':e.repo==='blender-addon'?'plan':'flow';
 if(mode==='flow'){
  for(let i=0;i<3;i++){const x=88+i*372;art+=box(x,276,320,190);art+=txt(x+24,322,String(i+1).padStart(2,'0'),18,C.accent);art+=txt(x+24,367,e.diagram[i],21);for(let j=0;j<3;j++)art+=line(x+24,402+j*14,x+260-j*35,402+j*14);if(i<2){art+=line(x+320,371,x+364,371,C.accent,3);art+=`<path d="M ${x+354} 362 l 10 9 l -10 9" fill="none" stroke="${C.accent}" stroke-width="3"/>`;}}
 }else if(mode==='network'||mode==='clusters'){
  const points=mode==='network'?[[140,390],[260,300],[310,455],[445,355],[575,300],[670,435],[850,350],[950,455],[1090,310]]:[[180,360],[250,310],[280,405],[350,350],[560,345],[640,300],[675,405],[850,330],[930,390],[1040,320]];
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];art+=line(...a,...b,mode==='network'&&i%2===0?C.accent:C.line,3);}
  for(const [x,y]of points)art+=dot(x,y,12);
  e.diagram.forEach((s,i)=>art+=txt(90+i*370,525,s,21));
 }else if(mode==='world'){
  for(let y=0;y<6;y++)for(let x=0;x<14;x++){art+=box(90+x*76,245+y*50,70,44,(x+y)%3===0?C.paper:C.inset);}
  [[3,1],[9,3],[12,4]].forEach(([x,y])=>art+=dot(125+x*76,267+y*50,10,C.muted));
  [[5,2],[10,1]].forEach(([x,y])=>art+=`<path d="M ${116+x*76} ${258+y*50} l18 18 m0 -18 l-18 18" stroke="${C.accent}" stroke-width="4"/>`);
  art+=dot(277,417,16,C.ink);art+=txt(90,595,'Schematic environment · not a recorded training frame',18,C.muted);
 }else if(mode==='wave'){
  let d='';for(let x=90;x<=1190;x+=3){const y=335+Math.sin((x-90)*0.018)*65+Math.sin((x-90)*0.045)*28;d+=(x===90?'M':'L')+x+' '+y;}
  art+=`<path d="${d}" fill="none" stroke="${C.accent}" stroke-width="4"/>`;
  for(let i=0;i<14;i++)art+=box(90+i*77,465,70,110,i%4===0?C.inset:C.paper);
  art+=txt(90,624,'Illustration of combined tones · no measured audio shown',18,C.muted);
 }else if(mode==='sequencer'){
  ['Kick','Snare','Hat','Clap'].forEach((s,y)=>{art+=txt(88,292+y*62,s,20);for(let i=0;i<16;i++)art+=box(230+i*56,260+y*62,42,42,((y===0&&i%4===0)||(y===1&&i%4===2)||(y===2&&i%2===0)||(y===3&&i===14))?C.accent:C.inset);});
  art+=txt(88,574,'Illustrative pattern · sequencer structure',18,C.muted);
 }else if(mode==='gallery'){
  art+=`<path d="M 165 270 L 640 215 L 1115 270 L 1115 525 L 640 585 L 165 525 Z" fill="${C.inset}" stroke="${C.line}" stroke-width="3"/>`;
  art+=line(640,215,640,585);
  for(let i=0;i<3;i++){art+=box(220+i*190,305,120,150,C.paper);art+=dot(280+i*190,370,22,C.muted);}
  art+=`<path d="M 330 550 Q 690 350 1000 510" fill="none" stroke="${C.accent}" stroke-width="3" stroke-dasharray="8 8"/>`;
  art+=txt(88,629,'Gallery structure · family photographs omitted',18,C.muted);
 }else if(mode==='plan'){
  art+=box(90,255,400,275,C.paper);art+=`<path d="M 135 300 h310 v180 h-180 v-90 h-130 z" fill="none" stroke="${C.ink}" stroke-width="6"/>`;
  art+=line(535,393,665,393,C.accent,3);
  art+=`<path d="M 750 315 l250 -60 l120 85 l-260 70 z M 750 315 v185 l110 80 v-170 M 860 580 l260 -75 v-165" fill="${C.inset}" stroke="${C.ink}" stroke-width="3"/>`;
  art+=txt(90,604,'Structured plan',22)+txt(750,624,'Constructed scene geometry',22);
 }
 let title=e.title;
 const titleSize=title.length>30?42:52;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="1280" height="720" fill="${C.paper}"/>${txt(88,83,'PROJECT DIAGRAM',17,C.muted,'letter-spacing="3"')}${txt(88,159,title,titleSize)}${txt(88,205,e.descriptor,22,C.muted)}${art}${line(88,659,1192,659)}${txt(88,692,'Illustration of the implemented structure',16,C.muted)}${txt(1192,692,e.timeframe||'',16,C.muted,'text-anchor="end"')}</svg>`;
 const svgPath=path.join(root,'media',e.repo+'.svg');await fs.writeFile(svgPath,svg);const png='media/'+e.repo+'.png';await sharp(Buffer.from(svg)).png().toFile(path.join(root,png));
 output.push({repo:e.repo,path:png,editable:'media/'+e.repo+'.svg',source:'Authored from the project implementation; labels in editorial.json',kind:'source-based explanatory diagram',width:1280,height:720,alt:e.coverAlt||'Explanatory diagram for '+e.title+', showing '+e.diagram.join(', ')+'.'});
}
await fs.writeFile(path.join(root,'covers.json'),JSON.stringify(output,null,2));
console.log('Covers:',output.length,'original or captured:',output.filter(x=>!x.kind.includes('diagram')&&!x.kind.startsWith('AI')).length,'AI illustrations:',output.filter(x=>x.kind.startsWith('AI')).length,'diagrams:',output.filter(x=>x.kind.includes('diagram')).length);
