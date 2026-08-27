import assert from 'node:assert';
import fs from 'node:fs';

const js=fs.readFileSync('app-v16.js','utf8');

for(const token of [
  'const lifecycle16=globalThis.TeacherOSLifecycle',
  'lifecycle16.onRender(refreshLifecycle16,{defer:true})',
  "if(!truth.known)return{source:truth.label||'컴시간 상태 미확인'",
  "status:'unknown',source:info.source,live:false,slot:null,message:'오늘 수업을 자동 확정하지 않습니다.'",
  "start.disabled=true;start.title=d.message"
])assert.ok(js.includes(token),`v16 lifecycle/truth guard missing: ${token}`);

assert.equal((js.match(/lifecycle16\.onRender\(/g)||[]).length,1,'v16 must register exactly one shared render hook');
assert.equal((js.match(/globalThis\.render=function/g)||[]).length,1,'v16 may keep only the isolated-test fallback render wrapper');
assert.ok(!js.includes("const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureCard();bindStart();applyAutoContext(false)},0);return r};"),'legacy direct v16 render wrapper must be removed from prepared runtime');

console.log('v16 lesson auto-context shared lifecycle regression tests passed');
