import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v14.js','utf8');
for(const token of [
  './live/comcigan-status.json',
  'collectorStatus14',
  'collectorMessage14',
  'COLLECTOR_ERROR',
  "status==='collector-error'",
  '수집 오류',
  'teacher-index-name-mismatch',
  'teacher-not-resolved',
  'collector-fetch',
  'parser-export',
  'timetable-empty',
  'config-invalid'
]) assert.ok(app.includes(token),`v1 Comcigan truth-state guard missing: ${token}`);
assert.ok(app.includes("s?.status==='error'?'COLLECTOR_ERROR':'WAITING'"),'missing feed must distinguish collector failure from pending state');
assert.ok(app.includes('컴시간 수집 연결 단계에서 최신표를 확인하지 못했습니다.'),'collector connection failure message missing');
assert.ok(app.includes('자동수집 설정이 완전하지 않아 최신표를 가져오지 못했습니다.'),'collector config failure message missing');
assert.ok(!app.includes('comcigan-fetch.log'),'browser runtime must never read raw collector logs');
console.log('v1 Comcigan collector truth-state tests passed with explicit sanitized failure messages');
