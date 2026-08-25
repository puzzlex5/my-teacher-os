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
  'config-invalid',
  'SHARED_COLLECTOR_AVAILABLE_14=false',
  'TRANSPORT_UNAVAILABLE',
  "status==='transport-unavailable'",
  '동기화 경로 미구성',
  'transportUnavailableMessage14',
  '자동세팅에서 시간표 파일을 올려 적용하세요.'
]) assert.ok(app.includes(token),`v1 Comcigan truth-state guard missing: ${token}`);
assert.ok(app.includes("transportUnavailable?'TRANSPORT_UNAVAILABLE':s?.status==='error'?'COLLECTOR_ERROR':'WAITING'"),'missing feed must distinguish unavailable transport, collector failure and pending state');
assert.ok(app.includes('컴시간 수집 연결 단계에서 최신표를 확인하지 못했습니다.'),'collector connection failure message missing');
assert.ok(app.includes('자동수집 설정이 완전하지 않아 최신표를 가져오지 못했습니다.'),'collector config failure message missing');
assert.ok(app.includes("configured&&!transportUnavailable?'':'disabled'"),'manual refresh must be disabled when no privacy-safe shared transport exists');
assert.ok(!app.includes('comcigan-fetch.log'),'browser runtime must never read raw collector logs');
console.log('v1 Comcigan truth-state tests passed with explicit pending, failure and unavailable-transport states');
