const assert=require('assert');
const A=require('../agent-core-v33.js');
const now=new Date(2026,7,29,10,0,0);
const year={
  year:2026,educationOffice:'경기도교육청',calendarEvents:[{id:'holiday',date:'2026-09-01',title:'재량휴업일'}],timetable:[],
  assessments:[{id:'a1',name:'음악 수행평가',due:'2026-09-01'}],
  projects:[{id:'p1',name:'가정통신문 제출',due:'2026-08-30'}],
  clubs:[],tasks:[]
};
const actions=A.buildActions(year,{now,policyPending:true,backupAgeDays:20,isNoClassEvent:e=>/휴업/.test(e.title)});
assert(actions.some(x=>x.id==='setup:timetable'&&x.automatable===false));
assert(actions.some(x=>x.category==='충돌'&&x.severity==='critical'));
assert(actions.some(x=>x.category==='행정'&&x.severity==='critical'));
assert(actions.some(x=>x.category==='정책'));
assert(actions.some(x=>x.id==='backup:stale'&&x.automatable===false));
const generated=A.safeTaskCandidates(actions,[]);
assert(generated.length>0);
assert(generated.every(x=>x.agentGenerated===true));
assert(!generated.some(x=>x.agentKey==='setup:timetable'||x.agentKey==='backup:stale'));
const again=A.safeTaskCandidates(actions,[{agentKey:generated[0].agentKey,done:true}]);
assert(!again.some(x=>x.agentKey===generated[0].agentKey));
assert.strictEqual(A.dueDays('2026-08-29',now),0);
assert.strictEqual(A.dueDays('2026-08-30',now),1);
console.log('v33 agent tests passed');
