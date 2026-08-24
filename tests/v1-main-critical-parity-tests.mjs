import assert from 'node:assert';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const app19=read('app-v19.js');
const app23=read('app-v23.js');
const app29=read('app-v29.js');
const sync=read('.github/workflows/sync-comcigan.yml');
const collector=read('scripts/sync-comcigan.mjs');

// Stable-main correctness fix: removing a work pack must not delete a pre-existing user project.
assert.ok(app19.includes("if(p.source==='Teacher OS 업무 라이브러리')return false"),'v1 lost work-pack-owned project deletion guard');
assert.ok(app19.includes('delete p.workPackId;delete p.libraryLinked;return true'),'v1 lost pre-existing project preservation on work-pack removal');

// Stable-main intake truthfulness: failed/empty first analysis can retry, and UI reports actual application.
for(const token of [
  'derivedSourceCount23',
  'duplicateImport23',
  'Number(prev.appliedCount||0)>0',
  "analysisStatus:got.length?'candidates':'no-candidates'",
  'auto.applied}개 자동 반영',
  'auto.blocked',
  '항목 미검출'
]) assert.ok(app23.includes(token),`v1 lost critical intake fix: ${token}`);
assert.ok(!app23.includes('localStorage.setItem(KEY'),'prepared v1 intake bypasses shared storage');

// Stable-main data-truth fix: unknown timetable state must never be presented as confirmed zero lessons.
for(const token of [
  'correctNextLessonTruth',
  'correctTodayTimetableTruth',
  '오늘 수업 여부를 확정할 수 없습니다.',
  '0건으로 처리하지 않습니다.',
  '수업 없음으로 처리하지 않습니다.'
]) assert.ok(app29.includes(token),`v1 lost timetable truth fix: ${token}`);

// Collector must refresh through the day and expose only explicit sanitized health codes.
assert.ok(sync.includes("cron: '*/30 * * * *'"),'v1 Comcigan cadence regressed from 30-minute refresh');
assert.ok(sync.includes('Record sanitized collector health'),'v1 lost sanitized Comcigan health recording');
assert.ok(sync.includes('live/comcigan-status.json'),'v1 lost non-sensitive collector status artifact');
assert.ok(sync.includes("machine_code=$(sed -n 's/^TEACHER_OS_CODE="),'v1 lost explicit collector machine-code classification');
assert.ok(collector.includes('TEACHER_OS_CODE='),'v1 collector no longer emits sanitized machine codes');
for(const token of ['teacher-not-resolved','teacher-index-name-mismatch','collector-init','collector-fetch','parser-export','timetable-empty']){
  assert.ok(sync.includes(token)||collector.includes(token),`v1 lost sanitized Comcigan diagnostic: ${token}`);
}
assert.ok(!collector.includes('matches.map(x=>`${x.i}:${x.name}`)'),'v1 collector may expose teacher identities in failure output');
assert.ok(!/cat\s+\/tmp\/comcigan-fetch\.log/.test(sync),'v1 workflow would expose raw Comcigan collector log');

console.log('v1 critical stable-main parity guards passed');
