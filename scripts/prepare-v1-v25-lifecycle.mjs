import fs from 'node:fs';

const path='app-v25.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  setTimeout(boot,0);const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(ensureUI,0);return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords')setTimeout(ensureUI,0);return r};";
const prepared="  setTimeout(boot,0);const lifecycle25=globalThis.TeacherOSLifecycle;if(lifecycle25?.onRender&&lifecycle25?.onSwitch){lifecycle25.onRender(()=>ensureUI(),{defer:true});lifecycle25.onSwitch(id=>{if(id==='studentrecords')ensureUI()},{defer:true})}else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(ensureUI,0);return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords')setTimeout(ensureUI,0);return r}};";

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle25=globalThis.TeacherOSLifecycle'))throw new Error('v1 v25 lifecycle preparation failed: expected wrapper block not found');

for(const token of [
  'const lifecycle25=globalThis.TeacherOSLifecycle',
  'lifecycle25.onRender(()=>ensureUI(),{defer:true})',
  "lifecycle25.onSwitch(id=>{if(id==='studentrecords')ensureUI()},{defer:true})",
  "if(lifecycle25?.onRender&&lifecycle25?.onSwitch)"
])if(!src.includes(token))throw new Error(`v1 prepared v25 missing lifecycle token: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v25 quality UI on shared lifecycle hooks with isolated-test fallback.');
