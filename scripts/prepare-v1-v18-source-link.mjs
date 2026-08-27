import fs from 'node:fs';

const path='app-v18.js';
let src=fs.readFileSync(path,'utf8');

const replacements=[
  ["const ev=(y.calendarEvents||[]).find(x=>x.date===s.date&&x.title===s.title);","const ev=(y.calendarEvents||[]).find(x=>x.source===s.source&&x.date===s.date&&x.title===s.title);"],
  ["const a=(y.assessments||[]).find(x=>x.name===s.title&&x.due===(s.date||''));","const a=(y.assessments||[]).find(x=>x.source===s.source&&x.name===s.title&&x.due===(s.date||''));"],
  ["const p=(y.projects||[]).find(x=>x.name===s.title&&x.due===(s.date||''));","const p=(y.projects||[]).find(x=>x.source===s.source&&x.name===s.title&&x.due===(s.date||''));"]
];

let changed=false;
for(const [oldText,newText] of replacements){
  if(src.includes(newText))continue;
  if(!src.includes(oldText))throw new Error(`v18 source-link preparation anchor missing: ${oldText}`);
  src=src.replace(oldText,newText);
  changed=true;
}

const legacyLifecycle="  renderCapabilities();\n  requestAnimationFrame(renderCapabilities);\n  const prevRender=globalThis.render;\n  if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(renderCapabilities,0);return r};";
const sharedLifecycle="  renderCapabilities();\n  requestAnimationFrame(renderCapabilities);\n  const lifecycle18=globalThis.TeacherOSLifecycle;\n  if(lifecycle18?.onRender)lifecycle18.onRender(renderCapabilities,{defer:true});\n  else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(renderCapabilities,0);return r}};";
if(src.includes(legacyLifecycle)){
  src=src.replace(legacyLifecycle,sharedLifecycle);
  changed=true;
}else if(!src.includes('const lifecycle18=globalThis.TeacherOSLifecycle')){
  throw new Error('v18 lifecycle preparation anchor missing');
}

for(const token of [
  'const lifecycle18=globalThis.TeacherOSLifecycle',
  'lifecycle18.onRender(renderCapabilities,{defer:true})',
  'x.source===s.source&&x.date===s.date&&x.title===s.title',
  "x.source===s.source&&x.name===s.title&&x.due===(s.date||'')"
])if(!src.includes(token))throw new Error(`v18 prepared source missing: ${token}`);

if(changed)fs.writeFileSync(path,src);
console.log(changed?'v18 enrichment preserves document source identity and uses shared lifecycle':'v18 source-aware enrichment and shared lifecycle already prepared');
