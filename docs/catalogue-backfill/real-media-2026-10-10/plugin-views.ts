import {SynodStatusView} from '/Users/hamishburke/Documents/Codex/project-media-2026-10-10/Synod/src/ui/status-view';
import {ResearchQueryModal} from '/Users/hamishburke/Documents/Codex/project-media-2026-10-10/Lumen/obsidian-plugin/src/research/index';
(window as any).renderProject=async (name:string)=>{
 if(name==='Synod') {
 const store={entries:[],activeValues:()=>[],lastRunFor:()=>null,status:{phase:'idle',detail:'Ready'},settings:{output:{rootFolder:'Synod'}},onStatus:()=>()=>{},onDataChange:()=>()=>{}};
 const plugin={store,prompts:{},isRunning:()=>false,onRunStateChange:()=>()=>{}};
 await new SynodStatusView({} as any,plugin as any).onOpen();
 } else new ResearchQueryModal({} as any,{} as any).onOpen();
};
