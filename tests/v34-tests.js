const assert=require('assert');
const I=require('../integration-core-v34.js');

assert.equal(I.normalizeGatewayUrl('http://script.google.com/macros/s/abc/exec'),'');
assert.equal(I.normalizeGatewayUrl('https://example.com/macros/s/abc/exec'),'');
assert.equal(I.normalizeGatewayUrl('https://script.google.com/macros/s/abc/exec?x=1'),'https://script.google.com/macros/s/abc/exec');

assert.equal(I.riskLevel({type:'gmail_send'}),'high');
assert.equal(I.riskLevel({type:'calendar_delete'}),'high');
assert.equal(I.riskLevel({type:'calendar_create_dedicated'}),'low');
assert.equal(I.mayAutoExecute({type:'calendar_create_dedicated'}),true);
assert.equal(I.mayAutoExecute({type:'calendar_create_dedicated',requiresApproval:true}),false);

assert.equal(I.safeType({source:'calendar',date:'2026-09-03',category:'calendar',confidence:.99}),'calendar');
assert.equal(I.safeType({source:'drive',date:'2026-09-03',category:'assessment',confidence:.95,authoritative:true}),'assessment');
assert.equal(I.safeType({source:'gmail',date:'2026-09-03',category:'assessment',confidence:.95,authoritative:false}),'task');
assert.equal(I.safeType({source:'gmail',date:'2026-09-03',category:'admin',confidence:.85}),'project');
assert.equal(I.safeType({source:'gmail',category:'admin',confidence:.7}),'task');

const year={calendarEvents:[],projects:[],assessments:[],tasks:[]};
const snap={items:[
  {source:'calendar',externalId:'c1',date:'2026-09-01',title:'교직원 회의',category:'calendar',confidence:.99},
  {source:'gmail',externalId:'m1',date:'2026-09-02',title:'제출 마감',category:'admin',confidence:.9,summary:'9월 2일까지 제출'},
  {source:'drive',externalId:'d1',date:'2026-09-03',title:'2학년 수행평가 계획',category:'assessment',confidence:.95,authoritative:true},
  {source:'gmail',externalId:'m2',date:'2026-09-04',title:'평가 안내',category:'assessment',confidence:.95,authoritative:false}
]};
const plan=I.planSafeChanges(year,snap);
assert.deepEqual(plan.map(x=>x.type),['calendar','project','assessment','task']);
const applied=I.applySafeChanges(year,plan);
assert.equal(applied.applied,4);
assert.equal(year.calendarEvents.length,1);
assert.equal(year.projects.length,1);
assert.equal(year.assessments.length,1);
assert.equal(year.tasks.length,1);
assert.equal(I.planSafeChanges(year,snap).length,0,'external keys must dedupe repeated syncs');

assert.equal(I.retryDelayMs(0),1000);
assert.equal(I.retryDelayMs(1),2000);
assert.equal(I.retryDelayMs(20),300000);

const summary=I.summarizeSnapshot({items:snap.items,approvals:[{status:'pending'}],health:{ok:true,lastScanAt:'2026-09-01T00:00:00Z'}});
assert.equal(summary.gmail,2);
assert.equal(summary.drive,1);
assert.equal(summary.calendar,1);
assert.equal(summary.approvals,1);
assert.equal(summary.healthy,true);

console.log('v34 Google autopilot tests passed');
