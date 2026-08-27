import fs from 'node:fs';

const path='app-v31.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  bind31();setTimeout(refresh31,0);\n  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refresh31,0);return r};\n  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='importer'||id==='documents')setTimeout(()=>{refresh31();if(id==='documents')renderVault31()},0);return r};";
const prepared="  bind31();setTimeout(refresh31,0);\n  const lifecycle31=globalThis.TeacherOSLifecycle;if(lifecycle31?.onRender&&lifecycle31?.onSwitch){lifecycle31.onRender(()=>refresh31(),{defer:true});lifecycle31.onSwitch(id=>{if(id==='importer'||id==='documents'){refresh31();if(id==='documents')renderVault31()}},{defer:true})}else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(refresh31,0);return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='importer'||id==='documents')setTimeout(()=>{refresh31();if(id==='documents')renderVault31()},0);return r}};";

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle31=globalThis.TeacherOSLifecycle'))throw new Error('v1 v31 lifecycle preparation failed: expected wrapper block not found');

for(const token of [
  'const lifecycle31=globalThis.TeacherOSLifecycle',
  'lifecycle31.onRender(()=>refresh31(),{defer:true})',
  "lifecycle31.onSwitch(id=>{if(id==='importer'||id==='documents'){refresh31();if(id==='documents')renderVault31()}},{defer:true})",
  'if(lifecycle31?.onRender&&lifecycle31?.onSwitch)'
])if(!src.includes(token))throw new Error(`v1 prepared v31 missing lifecycle token: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v31 source-retention UI on shared lifecycle hooks with isolated-test fallback.');
