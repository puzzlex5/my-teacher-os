import fs from 'node:fs';

const path='app-v16.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureCard();bindStart();applyAutoContext(false)},0);return r};";
const shared="  const refreshLifecycle16=()=>{ensureCard();bindStart();applyAutoContext(false)};\n  const lifecycle16=globalThis.TeacherOSLifecycle;\n  if(lifecycle16?.onRender)lifecycle16.onRender(refreshLifecycle16,{defer:true});\n  else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refreshLifecycle16,0);return r}};";

let changed=false;
if(src.includes(legacy)){
  src=src.replace(legacy,shared);
  changed=true;
}else if(!src.includes('const lifecycle16=globalThis.TeacherOSLifecycle')){
  throw new Error('v16 lifecycle preparation anchor missing');
}

for(const token of [
  'const refreshLifecycle16=()=>{ensureCard();bindStart();applyAutoContext(false)}',
  'const lifecycle16=globalThis.TeacherOSLifecycle',
  'lifecycle16.onRender(refreshLifecycle16,{defer:true})',
  "if(!truth.known)return{source:truth.label||'컴시간 상태 미확인'",
  "status:'unknown',source:info.source,live:false,slot:null,message:'오늘 수업을 자동 확정하지 않습니다.'"
])if(!src.includes(token))throw new Error(`v16 prepared source missing: ${token}`);

if(changed)fs.writeFileSync(path,src);
console.log(changed?'v16 lesson auto-context now uses shared lifecycle':'v16 shared lifecycle already prepared');
