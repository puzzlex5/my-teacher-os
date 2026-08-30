const assert=require('assert');
const W=require('../work-entity-core-v39.js');
const A=require('../autonomous-core-v40.js');
const doneYear={
  tasks:[{id:'t1',text:'수행평가 계획 제출',due:'2026-09-01',done:true}],
  calendarEvents:[{id:'c1',title:'수행평가 계획 제출',date:'2026-09-01',source:'calendar'}]
};
let entities=W.build(doneYear);
assert.strictEqual(entities.length,1);
assert.strictEqual(entities[0].calendarCount,1);
assert.strictEqual(entities[0].openCount,0);
assert.strictEqual(entities[0].completed,true,'calendar context must not keep a finished task open');
assert.strictEqual(entities[0].contextOnly,false);
assert.strictEqual(entities[0].actionable,true);
let plan=A.buildPlan({workEntities39:entities},{now:new Date(2026,7,30)});
assert.strictEqual(plan.actions.length,0,'completed work must not return to autonomous queue');
const calendarOnly={calendarEvents:[{id:'c2',title:'교직원 협의회',date:'2026-09-01',source:'calendar'}]};
entities=W.build(calendarOnly);
assert.strictEqual(entities.length,1);
assert.strictEqual(entities[0].contextOnly,true);
assert.strictEqual(entities[0].actionable,false);
assert.strictEqual(entities[0].completed,false);
assert.strictEqual(W.summary(entities).open,0);
assert.strictEqual(W.summary(entities).contextOnly,1);
plan=A.buildPlan({workEntities39:entities},{now:new Date(2026,7,30)});
assert.strictEqual(plan.actions.length,0,'calendar-only context must not create a duplicate local task');
const openYear={
  tasks:[{id:'t3',text:'공문 제출',due:'2026-08-30',done:false}],
  calendarEvents:[{id:'c3',title:'공문 제출',date:'2026-08-30',source:'calendar'}]
};
entities=W.build(openYear);
assert.strictEqual(entities[0].completed,false);
assert.strictEqual(entities[0].openCount,1);
assert.strictEqual(entities[0].actionable,true);
plan=A.buildPlan({workEntities39:entities},{now:new Date(2026,7,30)});
assert.strictEqual(plan.actions.length,1);
assert.strictEqual(plan.actions[0].autoSafe,true);
console.log('v43 completion truth tests passed');
