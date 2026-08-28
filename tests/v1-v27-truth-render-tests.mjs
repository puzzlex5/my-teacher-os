import assert from 'node:assert';
import fs from 'node:fs';

const src=fs.readFileSync('app-v27.js','utf8');

for(const token of [
  'function truth27(y,d)',
  "T.nextLessonTruth(y,d)",
  "truth&&!truth.known",
  '오늘 수업 여부를 확정할 수 없습니다.',
  "truth.reason==='collector-error'",
  "truth.reason==='transport-unavailable'",
  '이전 표를 현재표로 간주하지 않습니다.',
  "if(d.status==='unknown')",
  '교시 시간 미확인',
  '학교급/교시 시각 확인 필요',
  '수업은 등록되어 있지만 현재·다음 교시를 확정할 수 없습니다.',
  'function registerLifecycle27()',
  'TeacherOSLifecycle',
  'L.onRender(renderDesk,{defer:true})',
  "L.onSwitch(id=>{if(id==='dashboard')renderDesk()},{defer:true})"
])assert.ok(src.includes(token),`prepared v27 missing truth/lifecycle guard: ${token}`);

const renderStart=src.indexOf('function renderNext()');
const truthCheck=src.indexOf('truth&&!truth.known',renderStart);
const bellUnknown=src.indexOf("if(d.status==='unknown')",renderStart);
const noSlot=src.indexOf('if(!d.slot)',renderStart);
assert.ok(renderStart>=0&&truthCheck>renderStart&&bellUnknown>truthCheck&&noSlot>bellUnknown,'Teacher Desk must reject unknown timetable truth and unknown bell times before no-slot/current-slot conclusions');
assert.ok(!src.includes("const d=D.lessonContext(y,new Date());if(!d.slot)"),'legacy v27 still renders lesson conclusions before truth check');

const lifecycleStart=src.indexOf('function registerLifecycle27()');
const fallbackStart=src.indexOf('if(!registerLifecycle27())',lifecycleStart);
assert.ok(lifecycleStart>=0&&fallbackStart>lifecycleStart,'Teacher Desk must prefer shared lifecycle before legacy wrapper fallback');
assert.equal((src.match(/L\.onRender\(renderDesk,\{defer:true\}\)/g)||[]).length,1,'Teacher Desk should register exactly one shared render hook');
assert.equal((src.match(/L\.onSwitch\(id=>\{if\(id==='dashboard'\)renderDesk\(\)\},\{defer:true\}\)/g)||[]).length,1,'Teacher Desk should register exactly one dashboard switch hook');

console.log('v1 Teacher Desk truth, bell-time uncertainty, and shared lifecycle tests passed');
