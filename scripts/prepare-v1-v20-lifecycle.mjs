import fs from 'node:fs';

const path='app-v20.js';
let src=fs.readFileSync(path,'utf8');

const legacy="  ensure20();ensureUI();bind();render20();\n  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'){qa('.view').forEach(x=>x.classList.toggle('active',x.id==='studentrecords'));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='studentrecords'));if(q('#title'))q('#title').textContent='학생 기록';render20()}return r};\n  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(render20,0);return r};";
const studentView="qa('.view').forEach(x=>x.classList.toggle('active',x.id==='studentrecords'));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='studentrecords'));if(q('#title'))q('#title').textContent='학생 기록';render20()";
const prepared=`  ensure20();ensureUI();bind();render20();\n  const lifecycle20=globalThis.TeacherOSLifecycle;if(lifecycle20?.onRender&&lifecycle20?.onSwitch){lifecycle20.onRender(()=>render20(),{defer:true});lifecycle20.onSwitch(id=>{if(id==='studentrecords'){${studentView}}})}else{const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='studentrecords'){${studentView}}return r};const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(render20,0);return r}};`;

if(src.includes(legacy))src=src.replace(legacy,prepared);
else if(!src.includes('const lifecycle20=globalThis.TeacherOSLifecycle'))throw new Error('v1 v20 lifecycle preparation failed: expected wrapper block not found');

for(const token of [
  'const lifecycle20=globalThis.TeacherOSLifecycle',
  'lifecycle20.onRender(()=>render20(),{defer:true})',
  "lifecycle20.onSwitch(id=>{if(id==='studentrecords')",
  'if(lifecycle20?.onRender&&lifecycle20?.onSwitch)'
])if(!src.includes(token))throw new Error(`v1 prepared v20 missing lifecycle token: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v20 student-records UI on shared lifecycle hooks with isolated-test fallback.');
