const assert=require('assert');
const N=require('../neis-core-v35.js');

const schoolRows=[
 {ATPT_OFCDC_SC_CODE:'B10',ATPT_OFCDC_SC_NM:'서울특별시교육청',SD_SCHUL_CODE:'1111111',SCHUL_NM:'가온중학교',SCHUL_KND_SC_NM:'중학교'},
 {ATPT_OFCDC_SC_CODE:'J10',ATPT_OFCDC_SC_NM:'경기도교육청',SD_SCHUL_CODE:'2222222',SCHUL_NM:'가온중학교',SCHUL_KND_SC_NM:'중학교'}
];
const school=N.chooseSchool(schoolRows,'가온중학교','경기도교육청','중학교');
assert.strictEqual(school.schoolCode,'2222222');
assert.strictEqual(school.officeCode,'J10');
assert.strictEqual(N.chooseSchool(schoolRows,'없는학교','경기도교육청','중학교'),null);

const url=N.buildUrl('SchoolSchedule',{ATPT_OFCDC_SC_CODE:'J10',SD_SCHUL_CODE:'2222222',AY:'2026'},'abc123');
assert(url.startsWith('https://open.neis.go.kr/hub/SchoolSchedule?'));
assert(url.includes('Type=json'));
assert(url.includes('KEY=abc123'));

const parsed=N.parseRows({SchoolSchedule:[{head:[{list_total_count:1},{RESULT:{CODE:'INFO-000',MESSAGE:'정상 처리되었습니다.'}}]},{row:[{AA_YMD:'20260901',EVENT_NM:'개학식'}]}]},'SchoolSchedule');
assert.strictEqual(parsed.total,1);
assert.strictEqual(parsed.rows[0].EVENT_NM,'개학식');
assert.deepStrictEqual(N.parseRows({RESULT:{CODE:'INFO-200',MESSAGE:'해당하는 데이터가 없습니다.'}},'SchoolSchedule').rows,[]);

const existing=[
 {id:'manual',date:'2026-09-02',title:'수동 일정',source:'직접 입력'},
 {id:'old',date:'2026-09-03',title:'오래된 NEIS',neisOfficial:true,externalKey:'neis35:schedule:J10:2222222:20260903:오래된 NEIS'}
];
const reconciled=N.reconcileSchedule(existing,[
 {ATPT_OFCDC_SC_CODE:'J10',SD_SCHUL_CODE:'2222222',AA_YMD:'20260901',EVENT_NM:'개학식',EVENT_CNTNT:'2학기'},
 {ATPT_OFCDC_SC_CODE:'J10',SD_SCHUL_CODE:'2222222',AA_YMD:'20260901',EVENT_NM:'개학식',EVENT_CNTNT:'중복'}
]);
assert.strictEqual(reconciled.officialCount,1);
assert(reconciled.events.some(x=>x.id==='manual'));
assert(!reconciled.events.some(x=>x.title==='오래된 NEIS'));
assert(reconciled.events.some(x=>x.title==='개학식'&&x.readonly===true&&x.neisOfficial===true));

const year={
 timetable:[
  {day:'월',period:1,label:'2-3'},
  {day:'화',period:2,label:'3학년 4반'}
 ],
 assessments:[{target:'2-7'}],
 tasks:[]
};
assert.deepStrictEqual(N.extractClassRefs(year),[
 {grade:'2',className:'3'},{grade:'2',className:'7'},{grade:'3',className:'4'}
]);
assert.strictEqual(N.timetableService('중학교'),'misTimetable');
assert.strictEqual(N.timetableService('고등학교'),'hisTimetable');

const official=[
 {ALL_TI_YMD:'20260831',GRADE:'2',CLASS_NM:'3',PERIO:'1',ITRT_CNTNT:'수학'},
 {ALL_TI_YMD:'20260901',GRADE:'3',CLASS_NM:'4',PERIO:'2',ITRT_CNTNT:'음악'}
];
const anomalies=N.compareTeacherTimetable(year,official,['음악']);
assert.strictEqual(anomalies.length,1);
assert.strictEqual(anomalies[0].grade,'2');
assert.strictEqual(anomalies[0].actual,'수학');
const tasks=N.taskCandidates(anomalies,[]);
assert.strictEqual(tasks.length,1);
assert(tasks[0].neis35Key);
assert.strictEqual(N.taskCandidates(anomalies,[{neis35Key:tasks[0].neis35Key}]).length,0);

assert.deepStrictEqual(N.schoolYearRange(2026),{from:'20260301',to:'20270228'});
console.log('v35 NEIS official connector tests passed');
