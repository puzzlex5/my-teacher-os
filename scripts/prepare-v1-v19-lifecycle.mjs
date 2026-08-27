import fs from 'node:fs';

const path='app-v19.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  ensure19();ensureUI();bind();loadLibrary();\n  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='worklibrary'){qa('.view').forEach(x=>x.classList.toggle('active',x.id==='worklibrary'));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='worklibrary'));if(q('#title'))q('#title').textContent='업무 가져오기';renderLibrary()}return r};\n  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){ensure19();const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureUI();renderLibrary()},0);return r};";
const workView="qa('.view').forEach(x=>x.classList.toggle('active',x.id==='worklibrary'));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='worklibrary'));if(q('#title'))q('#title').textContent='업무 가져오기';renderLibrary()";
const refresh="ensure19();ensureUI();renderLibrary()";
const prepared=`  ensure19();ensureUI();bind();loadLibrary();\n  const lifecycle19=globalThis.TeacherOSLifecycle;if(lifecycle19?.onRender&&lifecycle19?.onSwitch){lifecycle19.onRender(()=>{${refresh}},{defer:true});lifecycle19.onSwitch(id=>{if(id==='worklibrary'){${workView}}})}else{const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='worklibrary'){${workView}}return r};const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){ensure19();const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureUI();renderLibrary()},0);return r}};`;

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle19=globalThis.TeacherOSLifecycle'))throw new Error('v1 v19 lifecycle preparation failed: expected wrapper block not found');

for(const token of [
  'const lifecycle19=globalThis.TeacherOSLifecycle',
  'lifecycle19.onRender(()=>{ensure19();ensureUI();renderLibrary()},{defer:true})',
  "lifecycle19.onSwitch(id=>{if(id==='worklibrary')",
  'if(lifecycle19?.onRender&&lifecycle19?.onSwitch)'
])if(!src.includes(token))throw new Error(`v1 prepared v19 missing lifecycle token: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v19 work-library UI on shared lifecycle hooks with isolated-test fallback.');
