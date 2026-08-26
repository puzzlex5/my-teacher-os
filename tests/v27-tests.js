const fs=require('fs');
const D=require('../core-v27.js');
function ok(v,m){if(!v)throw new Error(m)}
const y={schoolLevel:'중학교',timetable:[{day:'월',period:2,target:'2-3',subject:'음악',time:''}],liveTimetableWeeks:{},classProgress:{}};
const now=new Date('2026-08-24T09:50:00');
const c=D.lessonContext(y,now);
ok(c.status==='next','next lesson detection failed');
ok(c.slot&&c.slot.target==='2-3','target mapping failed');
ok(c.exact===false,'default bell time must be marked approximate');
ok(c.seconds===300,'countdown seconds failed');
const y2={...y,timetable:[{day:'월',period:2,target:'2-3',subject:'음악',time:'10:05~10:50'}]};
const c2=D.lessonContext(y2,new Date('2026-08-24T10:00:00'));
ok(c2.status==='next'&&c2.exact===true&&c2.seconds===300,'configured exact bell time failed');
const y3={schoolLevel:'중학교',timetable:[
  {day:'월',period:1,target:'1-1',time:'09:10~09:55'},
  {day:'화',period:1,target:'1-2',time:'09:20~10:05'},
  {day:'월',period:2,target:'2-1',time:'10:10~10:55'},
  {day:'월',period:3,target:'3-1',time:''}
],liveTimetableWeeks:{},classProgress:{}};
const ranges=D.periodRangeMap(y3);
ok(ranges.size===2,'period range cache should keep one exact range per period');
ok(ranges.get(1)?.label==='09:10~09:55','period cache must preserve first exact bell range');
ok(D.periodRange(y3,2,ranges)?.label==='10:10~10:55','cached exact period range failed');
ok(D.periodRange(y3,3,ranges)?.exact===false,'missing exact range must fall back to default bell time');
const digest=D.messageDigest('안녕하세요. 8월 25일까지 평가계획을 제출해 주세요. 제출 전 부장 확인이 필요합니다. 감사합니다.');
ok(digest.actions.length>=1,'message action extraction failed');
ok(digest.deadlines.some(x=>/8월 25일|까지/.test(x)),'message deadline extraction failed');
ok(D.tidyText('문장   하나!!\n\n문장 둘..')==='문장 하나!\n문장 둘.','meaning-preserving tidy failed');
const contacts=D.safeContactRows([{name:'홍길동',extension:'301',department:'교무부'},{name:'',extension:'999'}]);
ok(contacts.length===1&&contacts[0].extension==='301','contact sanitation failed');
const app=fs.readFileSync('app-v27.js','utf8'),core=fs.readFileSync('core-v27.js','utf8'),css=fs.readFileSync('app-v27.css','utf8'),index=fs.readFileSync('index.html','utf8');
['teacherDesk27','다음 교시','기본 교시시간 기준(예상)','myTeacherOS.staffContacts.v1','연락처는 이 브라우저에만 저장','메시지·공문 빠른 정리','없는 내용을 만들어내지 않습니다','위젯 설정'].forEach(t=>ok(app.includes(t),'app token missing: '+t));
ok(core.includes('periodRangeMap')&&core.includes('ranges=periodRangeMap(y)'),'Teacher Desk must cache period ranges per lesson context');
ok(!app.includes('fetch('),'v27 daily workspace must not upload contacts/messages');
ok(css.includes('@media(max-width:680px)'),'v27 mobile CSS missing');
ok(index.includes('core-v27.js')&&index.includes('app-v27.js')&&index.includes('app-v27.css'),'index v27 wiring missing');
console.log('v0.27 Teacher Desk live workspace tests passed');