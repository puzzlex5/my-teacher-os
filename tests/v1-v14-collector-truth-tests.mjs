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
  'teacher-not-resolved'
]) assert.ok(app.includes(token),`v1 Comcigan truth-state guard missing: ${token}`);
assert.ok(app.includes("s?.status==='error'?'COLLECTOR_ERROR':'WAITING'"),'missing feed must distinguish collector failure from pending state');
assert.ok(!app.includes('comcigan-fetch.log'),'browser runtime must never read raw collector logs');
console.log('v1 Comcigan collector truth-state tests passed');
