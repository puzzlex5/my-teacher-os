import fs from 'node:fs';

const path='app-v17.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  const prev=globalThis.render;if(typeof prev==='function')globalThis.render=function(){const r=prev.apply(this,arguments);setTimeout(()=>{removeManual();addBuild();bind();refresh(false)},0);return r};";
const shared="  const refreshLifecycle17=()=>{removeManual();addBuild();bind();refresh(false)};\n  const lifecycle17=globalThis.TeacherOSLifecycle;\n  if(lifecycle17?.onRender)lifecycle17.onRender(refreshLifecycle17,{defer:true});\n  else{const prev=globalThis.render;if(typeof prev==='function')globalThis.render=function(){const r=prev.apply(this,arguments);setTimeout(refreshLifecycle17,0);return r}};";

let changed=false;
if(src.includes(legacy)){
  src=src.replace(legacy,shared);
  changed=true;
}else if(!src.includes('const lifecycle17=globalThis.TeacherOSLifecycle')){
  throw new Error('v17 lifecycle preparation anchor missing');
}

for(const token of [
  'const refreshLifecycle17=()=>{removeManual();addBuild();bind();refresh(false)}',
  'const lifecycle17=globalThis.TeacherOSLifecycle',
  'lifecycle17.onRender(refreshLifecycle17,{defer:true})',
  "if(!truth.known)return{source:truth.label||'컴시간 상태 미확인'",
  "status:'unknown',msg:'오늘 수업을 자동 확정하지 않습니다.'"
])if(!src.includes(token))throw new Error(`v17 prepared source missing: ${token}`);

if(changed)fs.writeFileSync(path,src);
console.log(changed?'v17 lesson truth UI now uses shared lifecycle':'v17 shared lifecycle already prepared');
