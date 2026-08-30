const assert=require('assert');
const P=require('../privacy-core-v46.js');
globalThis.TeacherOSPrivacy46=P;
const D=require('../desktop-core-v36.js');
const I=require('../integration-core-v34.js');

const raw='학생명: 김민수 / 학번 20315 / 010-1234-5678 / 090101-3123456 / kid@example.com';
const red=P.redact(raw);
assert(!red.includes('김민수'));
assert(!red.includes('20315'));
assert(!red.includes('010-1234-5678'));
assert(!red.includes('090101-3123456'));
assert(!red.includes('kid@example.com'));
assert(red.includes('[이름]'));
assert(red.includes('[학생번호]'));
assert(red.includes('[주민번호]'));

assert.equal(P.safeSourceName('김민수_학생부.xlsx','student_record'),'학생부 자료.xlsx');
assert.equal(P.redact('김민수_수행평가.xlsx'),'[학생]_수행평가.xlsx');
assert.equal(P.redact('음악과_수행평가.xlsx'),'음악과_수행평가.xlsx','교과명은 이름으로 오탐 마스킹하지 않아야 함');

const sig=D.sanitizeSignal({externalKey:'file:abc',category:'student_record',title:'학생명 김민수 생활기록부 점검',sourceName:'김민수_학생부.xlsx',confidence:.9,piiRedacted:false});
assert.equal(sig.sourceName,'학생부 자료.xlsx');
assert(!sig.title.includes('김민수'));
assert.equal(sig.piiRedacted,true);
assert.equal(sig.privacyVersion,46);

const year={calendarEvents:[],projects:[],assessments:[],tasks:[]};
const snap={items:[{source:'drive',externalId:'d-private',date:'2026-09-05',title:'김민수_수행평가',summary:'학생명: 김민수 학번 20315',category:'assessment',confidence:.96,authoritative:true}]};
const key=I.sourceKey(snap.items[0]);
assert(!key.includes('김민수'),'dedupe key must not contain raw title PII');
const plan=I.planSafeChanges(year,snap);
assert.equal(plan.length,1);
assert(!JSON.stringify(plan).includes('김민수'));
assert(!JSON.stringify(plan).includes('20315'));
I.applySafeChanges(year,plan);
assert(!JSON.stringify(year).includes('김민수'));
assert.equal(I.planSafeChanges(year,snap).length,0);

console.log('v46 student privacy shield tests passed');
