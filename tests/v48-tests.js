const assert=require('assert');
const U=require('../simple-ui-core-v48.js');

assert.deepStrictEqual(U.PRIMARY_NAV.map(x=>x.view),['dashboard','calendar','timetable','assessment','projects','settings']);
assert.deepStrictEqual(U.PRIMARY_NAV.map(x=>x.label),['오늘','일정','수업','평가','업무','시스템']);
assert.deepStrictEqual(U.SECONDARY_NAV.map(x=>x.view),['importer','clubs','policy','documents','memory']);
assert(U.TECH_DASH_IDS.includes('googleAutopilot34'));
assert(U.TECH_DASH_IDS.includes('desktopBridge36'));
assert(U.TECH_DASH_IDS.includes('supervisor41'));
assert(U.TECH_DASH_IDS.includes('autonomous40'));

const b=U.brief({summary:{critical:2,warning:3,approvalOnly:1,autoSafe:7},focus:[
  {title:'공문 제출',due:'2026-09-02',severity:'critical'},
  {title:'평가 준비',due:'2026-09-03'},
  {title:'회의'},
  {title:'수업 준비'},
  {title:'숨겨질 다섯번째'}
]});
assert.deepStrictEqual({urgent:b.urgent,week:b.week,confirm:b.confirm,auto:b.auto},{urgent:2,week:3,confirm:1,auto:7});
assert.strictEqual(b.focus.length,4);
assert.strictEqual(b.focus[0].title,'공문 제출');
assert.strictEqual(U.readyText({essentialReady:true}).tone,'ok');
assert.strictEqual(U.readyText({essentialReady:false}).tone,'warn');
console.log('v48 simple UI tests passed');
