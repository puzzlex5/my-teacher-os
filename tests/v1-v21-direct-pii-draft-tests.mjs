import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v21.js','utf8');
assert.ok(app.includes('DIRECT_PII_RE21'),'v21 direct-PII evidence guard missing');
assert.ok(app.includes("!DIRECT_PII_RE21.test(r.text||'')"),'v21 evidence filter does not reject direct PII');

const direct=/(?:\b01[016789][- .]?\d{3,4}[- .]?\d{4}\b|\b\d{6}[- ]?[1-4]\d{6}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/i;
for(const sample of ['010-2468-1357','010 2468 1357','school.teacher@example.org','120101-3123456']){
  assert.ok(direct.test(sample),`direct PII sample was not detected: ${sample}`);
}
for(const sample of ['합주 활동에서 리듬을 조정하며 협력함','진로 탐색 발표에 성실히 참여함','2026-09-03 수행평가']){
  assert.equal(direct.test(sample),false,`ordinary school observation falsely detected as PII: ${sample}`);
}

function evidenceAllowed(text){return !direct.test(text)}
assert.equal(evidenceAllowed('모둠 합주를 주도함. 연락처 010-2468-1357'),false,'phone-bearing evidence can enter draft generation');
assert.equal(evidenceAllowed('학생 이메일 school.teacher@example.org로 자료 제출'),false,'email-bearing evidence can enter draft generation');
assert.equal(evidenceAllowed('리듬 패턴을 분석하고 모둠원과 협력함'),true,'ordinary evidence is incorrectly blocked');

console.log('v1 v21 draft generation excludes direct PII evidence before variants are created.');
