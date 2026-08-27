import fs from 'node:fs';

const path='app-v30.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  wrapApply();bind();setTimeout(refresh,0);\n  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refresh,0);return r};\n  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='importer'||id==='documents')setTimeout(refresh,0);return r};";
const prepared="  wrapApply();bind();setTimeout(refresh,0);\n  const lifecycle30=globalThis.TeacherOSLifecycle;if(lifecycle30?.onRender&&lifecycle30?.onSwitch){lifecycle30.onRender(()=>refresh(),{defer:true});lifecycle30.onSwitch(id=>{if(id==='importer'||id==='documents')refresh()},{defer:true})}else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refresh,0);return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='importer'||id==='documents')setTimeout(refresh,0);return r}};";

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle30=globalThis.TeacherOSLifecycle'))throw new Error('v1 v30 lifecycle preparation failed: expected wrapper block not found');

for(const token of [
  'const lifecycle30=globalThis.TeacherOSLifecycle',
  'lifecycle30.onRender(()=>refresh(),{defer:true})',
  "lifecycle30.onSwitch(id=>{if(id==='importer'||id==='documents')refresh()},{defer:true})",
  'if(lifecycle30?.onRender&&lifecycle30?.onSwitch)'
])if(!src.includes(token))throw new Error(`v1 prepared v30 missing lifecycle token: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v30 document-version UI on shared lifecycle hooks with isolated-test fallback.');
