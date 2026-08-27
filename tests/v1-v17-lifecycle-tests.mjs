import assert from 'node:assert';
import fs from 'node:fs';

const js=fs.readFileSync('app-v17.js','utf8');

for(const token of [
  'const lifecycle17=globalThis.TeacherOSLifecycle',
  'lifecycle17.onRender(refreshLifecycle17,{defer:true})',
  "if(!truth.known)return{source:truth.label||'컴시간 상태 미확인'",
  "status:'unknown',msg:'오늘 수업을 자동 확정하지 않습니다.'",
  "start.disabled=true;start.title=d.msg"
])assert.ok(js.includes(token),`v17 lifecycle/truth guard missing: ${token}`);

assert.equal((js.match(/lifecycle17\.onRender\(/g)||[]).length,1,'v17 must register exactly one shared render hook');
assert.equal((js.match(/globalThis\.render=function/g)||[]).length,1,'v17 may keep only the isolated-test fallback render wrapper');
assert.ok(!js.includes("const prev=globalThis.render;if(typeof prev==='function')globalThis.render=function(){const r=prev.apply(this,arguments);setTimeout(()=>{removeManual();addBuild();bind();refresh(false)},0);return r};"),'legacy direct v17 render wrapper must be removed from prepared runtime');

console.log('v17 lesson truth shared lifecycle regression tests passed');
