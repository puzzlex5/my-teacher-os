import fs from 'node:fs';

const path='app-v14.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  const previousRender=globalThis.render;if(typeof previousRender==='function'){globalThis.render=function(){const r=previousRender.apply(this,arguments);setTimeout(()=>{renderPlainSyncCard();lockTimetableReadOnly()},0);return r}}\n  boot();";
const shared="  const refreshLifecycle14=()=>{renderPlainSyncCard();lockTimetableReadOnly()};\n  const lifecycle14=globalThis.TeacherOSLifecycle;\n  if(lifecycle14?.onRender)lifecycle14.onRender(refreshLifecycle14,{defer:true});\n  else{\n    const previousRender=globalThis.render;if(typeof previousRender==='function'){globalThis.render=function(){const r=previousRender.apply(this,arguments);setTimeout(refreshLifecycle14,0);return r}}\n  }\n  boot();";

let changed=false;
if(src.includes(legacy)){
  src=src.replace(legacy,shared);
  changed=true;
}else if(!src.includes('const lifecycle14=globalThis.TeacherOSLifecycle')){
  throw new Error('v14 lifecycle preparation anchor missing');
}

for(const token of [
  'const lifecycle14=globalThis.TeacherOSLifecycle',
  'lifecycle14.onRender(refreshLifecycle14,{defer:true})',
  'renderPlainSyncCard()',
  'lockTimetableReadOnly()',
  "LOCAL_CFG_KEY='myTeacherOS.comciganConfig'"
])if(!src.includes(token))throw new Error(`v14 prepared source missing: ${token}`);

if(changed)fs.writeFileSync(path,src,'utf8');
console.log(changed?'v14 Comcigan UI now uses shared lifecycle':'v14 shared lifecycle already prepared');
