const assert=require('assert');
const C=require('../core-v05.js');
assert.equal(C.curriculumMode(2025,'중학교'),'1학년 2022 개정 / 2·3학년 2015 개정');
assert.equal(C.curriculumMode(2026,'고등학교'),'1·2학년 2022 개정 / 3학년 2015 개정');
assert.equal(C.curriculumMode(2027,'중학교'),'2022 개정 교육과정 · 전 학년 적용');
assert.equal(C.creditMode(2025,'고등학교'),true);
assert.equal(C.creditMode(2027,'중학교'),false);
assert.equal(C.normDate(null,9,3,2026),'2026-09-03');
assert.equal(C.findDates('9월 3일 축제',2026)[0].date,'2026-09-03');
assert.equal(C.extractWeight('수행평가 반영비율 30%'),'30%');
assert.equal(C.extractTarget('2학년 수행평가'),'2학년');
const tt=C.parseTimetableGrid([
 ['교시','월','화','수','목','금'],
 ['1교시','2-1','', '2-3','',''],
 ['2교시','','3-2','','1-4','']
],'음악');
assert.equal(tt.length,4);
assert.ok(tt.some(x=>x.day==='월'&&x.period===1&&x.target==='2-1'));
assert.ok(C.privacySignals('010-1234-5678').includes('휴대전화번호 형태'));
assert.equal(C.privacySignals('UID:event-20260903@example.invalid\nSUMMARY:학교축제').includes('이메일 주소'),false);
assert.ok(C.privacySignals('ATTENDEE:MAILTO:teacher@example.com').includes('이메일 주소'));
assert.ok(C.privacySignals('DESCRIPTION:문의 teacher@example.com').includes('이메일 주소'));
const slots=C.countTeachingSlots([{day:'월',period:1,label:'2-1',target:'2-1'}],[{date:'2026-08-24',title:'재량휴업일'}],'2-1','2026-08-21','2026-09-07');
assert.equal(slots,2);
console.log('Teacher OS core tests: PASS (16 assertions)');
