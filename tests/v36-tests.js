const assert=require('assert');
const D=require('../desktop-core-v36.js');
assert.equal(D.normalizeEndpoint('http://127.0.0.1:43135/path'),'http://127.0.0.1:43135');
assert.equal(D.normalizeEndpoint('http://localhost:43135'),'http://localhost:43135');
assert.equal(D.normalizeEndpoint('https://evil.example:43135'),'');
assert.equal(D.normalizeEndpoint('http://192.168.0.2:43135'),'');
assert.equal(D.normalizeEndpoint('http://127.0.0.1:9999'),'');
assert.equal(D.validToken('abcdefghijklmnopqrstuvwx'),true);
assert.equal(D.validToken('short'),false);
const year={tasks:[{externalKey:'file:known'}],projects:[],calendarEvents:[],assessments:[],imports:[]};
const snap={items:[
 {externalKey:'file:known',category:'admin',title:'중복',due:'2026-09-01',confidence:.9,piiRedacted:true},
 {externalKey:'file:a',category:'admin',title:'공문 제출',due:'2026-09-10',confidence:.91,piiRedacted:true},
 {externalKey:'file:b',category:'assessment',title:'수행평가 계획',due:'2026-09-12',confidence:.9,piiRedacted:true},
 {externalKey:'file:c',category:'schedule',title:'교과협의회',due:'2026-09-15',confidence:.9,piiRedacted:true},
 {externalKey:'file:d',category:'student_record',title:'학생부 확인',due:'',confidence:.8,piiRedacted:true},
 {externalKey:'bad',category:'unknown',title:'무시',confidence:1}
]};
const plan=D.plan(year,snap);
assert.equal(plan.length,4);
assert.equal(plan.filter(x=>x.type==='project').length,1);
assert.equal(plan.filter(x=>x.type==='calendar').length,1);
assert.equal(plan.filter(x=>x.type==='task').length,2);
const applied=D.apply(year,plan);
assert.equal(applied.applied,4);
assert.equal(year.projects.length,1);
assert.equal(year.calendarEvents.length,1);
assert.equal(year.tasks.length,3);
assert(year.tasks.every(x=>x.externalKey));
const sum=D.summarize(snap);
assert.equal(sum.admin,2);
assert.equal(sum.assessment,1);
console.log('v36 tests passed');
