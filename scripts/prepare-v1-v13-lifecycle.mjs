import fs from 'node:fs';

const path='app-v13.js';
let src=fs.readFileSync(path,'utf8');

const legacy=`  try{const prev=render;if(typeof prev==='function'){render=function(){const r=prev.apply(this,arguments);try{renderV13()}catch(err){console.warn('v13',err)}return r}}}catch{}`;
const shared=`  const lifecycle13=globalThis.TeacherOSLifecycle;
  if(lifecycle13?.onRender)lifecycle13.onRender(renderV13);
  else try{const prev=render;if(typeof prev==='function'){render=function(){const r=prev.apply(this,arguments);try{renderV13()}catch(err){console.warn('v13',err)}return r}}}catch{}`;

let changed=false;
if(src.includes(legacy)){
  src=src.replace(legacy,shared);
  changed=true;
}else if(!src.includes('const lifecycle13=globalThis.TeacherOSLifecycle')){
  throw new Error('v13 lifecycle preparation anchor missing');
}

for(const token of [
  'const lifecycle13=globalThis.TeacherOSLifecycle',
  'lifecycle13.onRender(renderV13)',
  'function searchIndex()',
  'function renderInbox(y)',
  'function renderRecent(y)'
])if(!src.includes(token))throw new Error(`v13 prepared source missing: ${token}`);

if(changed)fs.writeFileSync(path,src);
console.log(changed?'v13 search/inbox now uses shared lifecycle':'v13 shared lifecycle already prepared');
