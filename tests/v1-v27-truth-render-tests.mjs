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
  '이전 표를 현재표로 간주하지 않습니다.'
])assert.ok(src.includes(token),`prepared v27 missing immediate truth guard: ${token}`);

const renderStart=src.indexOf('function renderNext()');
const truthCheck=src.indexOf('truth&&!truth.known',renderStart);
const noSlot=src.indexOf('if(!d.slot)',renderStart);
assert.ok(renderStart>=0&&truthCheck>renderStart&&noSlot>truthCheck,'Teacher Desk must reject unknown timetable truth before rendering no-slot/current-slot conclusions');

assert.ok(!src.includes("const d=D.lessonContext(y,new Date());if(!d.slot)"),'legacy v27 still renders lesson conclusions before truth check');
console.log('v1 Teacher Desk first-render timetable truth guard tests passed');
