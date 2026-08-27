import fs from 'node:fs';

const path='app-v15.js';
let src=fs.readFileSync(path,'utf8');

const legacy=`  const previousRender=globalThis.render;
  if(typeof previousRender==='function'){
    globalThis.render=function(){
      const result=previousRender.apply(this,arguments);
      scheduleLock();
      return result;
    };
  }`;
const shared=`  const lifecycle15=globalThis.TeacherOSLifecycle;
  if(lifecycle15?.onRender)lifecycle15.onRender(scheduleLock);
  else{
    const previousRender=globalThis.render;
    if(typeof previousRender==='function'){
      globalThis.render=function(){
        const result=previousRender.apply(this,arguments);
        scheduleLock();
        return result;
      };
    }
  }`;

let changed=false;
if(src.includes(legacy)){
  src=src.replace(legacy,shared);
  changed=true;
}else if(!src.includes('const lifecycle15=globalThis.TeacherOSLifecycle')){
  throw new Error('v15 lifecycle preparation anchor missing');
}

for(const token of [
  'const lifecycle15=globalThis.TeacherOSLifecycle',
  'lifecycle15.onRender(scheduleLock)',
  "section.classList.add('timetable-auto-only')",
  "baseTable.classList.add('readonly-timetable')",
  "ev.stopImmediatePropagation()"
])if(!src.includes(token))throw new Error(`v15 prepared source missing: ${token}`);

if(changed)fs.writeFileSync(path,src);
console.log(changed?'v15 timetable lock now uses shared lifecycle':'v15 shared lifecycle already prepared');
