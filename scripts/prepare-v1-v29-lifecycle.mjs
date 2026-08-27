import fs from 'node:fs';

const path='app-v29.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  refresh29();\n  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh29();return r};\n  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='dashboard'||id==='timetable')refresh29();return r};";
const prepared="  refresh29();\n  const lifecycle29=globalThis.TeacherOSLifecycle;if(lifecycle29?.onRender&&lifecycle29?.onSwitch){lifecycle29.onRender(()=>refresh29());lifecycle29.onSwitch(id=>{if(id==='dashboard'||id==='timetable')refresh29()})}else{const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh29();return r};const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='dashboard'||id==='timetable')refresh29();return r}};";

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle29=globalThis.TeacherOSLifecycle'))throw new Error('v1 v29 lifecycle preparation failed: expected wrapper block not found');

for(const token of [
  'const lifecycle29=globalThis.TeacherOSLifecycle',
  'lifecycle29.onRender(()=>refresh29())',
  "lifecycle29.onSwitch(id=>{if(id==='dashboard'||id==='timetable')refresh29()})",
  'if(lifecycle29?.onRender&&lifecycle29?.onSwitch)'
])if(!src.includes(token))throw new Error(`v1 prepared v29 missing lifecycle token: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v29 verified-data UI on shared lifecycle hooks with isolated-test fallback.');
