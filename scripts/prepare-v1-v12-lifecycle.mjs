import fs from 'node:fs';

const path='app-v12.js';
let src=fs.readFileSync(path,'utf8');

const before=`  const previousRender=globalThis.render;if(typeof previousRender==='function'){globalThis.render=function(){const r=previousRender.apply(this,arguments);try{renderVisuals()}catch(e){console.warn('visual dashboard',e)}return r}}`;
const after=`  function refreshVisuals12(){try{renderVisuals()}catch(e){console.warn('visual dashboard',e)}}
  const lifecycle12=globalThis.TeacherOSLifecycle;
  if(lifecycle12?.onRender)lifecycle12.onRender(refreshVisuals12);
  else{const previousRender=globalThis.render;if(typeof previousRender==='function'){globalThis.render=function(){const r=previousRender.apply(this,arguments);refreshVisuals12();return r}}}`;

if(src.includes(before))src=src.replace(before,after);
else if(!src.includes(after))throw new Error('v12 lifecycle preparation failed: render wrapper marker missing');

for(const token of [
  'function refreshVisuals12()',
  'globalThis.TeacherOSLifecycle',
  'lifecycle12.onRender(refreshVisuals12)',
  'else{const previousRender=globalThis.render'
])if(!src.includes(token))throw new Error(`v12 lifecycle preparation missing: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v12 visual dashboard to use the shared render lifecycle.');
