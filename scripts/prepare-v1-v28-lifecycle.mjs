import fs from 'node:fs';

const path='app-v28.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  bind28();refresh28();\n  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh28();return r};\n  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28();return r};";
const prepared="  bind28();refresh28();\n  const lifecycle28=globalThis.TeacherOSLifecycle;if(lifecycle28?.onRender&&lifecycle28?.onSwitch){lifecycle28.onRender(()=>refresh28());lifecycle28.onSwitch(id=>{if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28()})}else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh28();return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28();return r}};";

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle28=globalThis.TeacherOSLifecycle'))throw new Error('v1 v28 lifecycle preparation failed: expected wrapper block not found');

for(const token of [
  'const lifecycle28=globalThis.TeacherOSLifecycle',
  'lifecycle28.onRender(()=>refresh28())',
  "lifecycle28.onSwitch(id=>{if(id==='studentrecords'||id==='calendar'||id==='dashboard')refresh28()})",
  'if(lifecycle28?.onRender&&lifecycle28?.onSwitch)'
])if(!src.includes(token))throw new Error(`v1 prepared v28 missing lifecycle token: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v28 precision UI on shared lifecycle hooks with isolated-test fallback.');
