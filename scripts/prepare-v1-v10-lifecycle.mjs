import fs from 'node:fs';

const path='app-v10.js';
let src=fs.readFileSync(path,'utf8');

const switchBefore=`  const oldSwitch=switchView;switchView=function(id){oldSwitch(id);if(id==='skills'){qa('.view').forEach(x=>x.classList.toggle('active',x.id===id));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===id));q('#title').textContent='Skills'}};`;
const switchAfter=`  function activateSkillsView10(id){if(id!=='skills')return;qa('.view').forEach(x=>x.classList.toggle('active',x.id===id));qa('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===id));q('#title').textContent='Skills'}`;
if(src.includes(switchBefore))src=src.replace(switchBefore,switchAfter);
else if(!src.includes(switchAfter))throw new Error('v10 lifecycle preparation failed: switch wrapper marker missing');

const renderBefore=`  const prevRender=render;render=function(){ensureState();prevRender();const y=cur();if(y){renderSkills(y);renderBrief(y);setTimeout(()=>runAutoSkills(false),0)}else{if(q('#skillGrid'))q('#skillGrid').innerHTML='<div class="empty">학년도를 먼저 만들어 주세요.</div>';if(q('#skillBrief'))q('#skillBrief').innerHTML=''}};`;
const renderAfter=`  function refreshSkills10(){ensureState();const y=cur();if(y){renderSkills(y);renderBrief(y);setTimeout(()=>runAutoSkills(false),0)}else{if(q('#skillGrid'))q('#skillGrid').innerHTML='<div class="empty">학년도를 먼저 만들어 주세요.</div>';if(q('#skillBrief'))q('#skillBrief').innerHTML=''}}
  const lifecycle10=globalThis.TeacherOSLifecycle;
  if(lifecycle10?.onRender&&lifecycle10?.onSwitch){lifecycle10.onRender(refreshSkills10);lifecycle10.onSwitch(activateSkillsView10)}else{
    const oldSwitch=switchView;switchView=function(id){oldSwitch(id);activateSkillsView10(id)};
    const prevRender=render;render=function(){const result=prevRender.apply(this,arguments);refreshSkills10();return result};
  }`;
if(src.includes(renderBefore))src=src.replace(renderBefore,renderAfter);
else if(!src.includes(renderAfter))throw new Error('v10 lifecycle preparation failed: render wrapper marker missing');

for(const token of [
  'function refreshSkills10()',
  'function activateSkillsView10(id)',
  'globalThis.TeacherOSLifecycle',
  'lifecycle10.onRender(refreshSkills10)',
  'lifecycle10.onSwitch(activateSkillsView10)'
])if(!src.includes(token))throw new Error(`v10 lifecycle preparation missing: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v10 Teacher Skills to use the shared render/switch lifecycle.');
