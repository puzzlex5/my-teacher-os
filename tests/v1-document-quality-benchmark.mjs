import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const D=require('../core-v23.js');

// Synthetic, no-PII school-shaped fixtures. Keep several variants per class so CI
// measures class coverage rather than one easy filename for each document type.
const fixtures=[
  {id:'calendar-annual',expected:'calendar',input:{name:'2026학년도 학사일정.pdf',ext:'pdf',text:'학사 일정\n3월 2일 개학\n5월 15일 체육대회\n7월 20일 방학\n12월 31일 종업'}},
  {id:'calendar-events',expected:'calendar',input:{name:'연간 교육일정.hwpx',ext:'hwpx',text:'연간 일정 학교행사 상담주간 현장체험학습 축제 예술제 개학 방학'}},
  {id:'calendar-ics',expected:'calendar',input:{name:'학교행사.ics',ext:'ics',text:'BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:학교축제\nEND:VEVENT\nEND:VCALENDAR'}},

  {id:'timetable-teacher',expected:'timetable',input:{name:'교사 시간표.xlsx',ext:'xlsx',text:'시간표 월 화 수 목 금 1교시 2교시 3교시 담당 교사 교과 시간',layout:{tableRows:12,timetableSlots:18,dayHeaders:5,classCodes:12,periodMarkers:7}}},
  {id:'timetable-grid',expected:'timetable',input:{name:'수업시간표.csv',ext:'csv',text:'월 화 수 목 금 1교시 2교시 3교시 4교시 음악 체육 과학',layout:{tableRows:10,timetableSlots:15,dayHeaders:5,classCodes:8,periodMarkers:6}}},
  {id:'timetable-pdf',expected:'timetable',input:{name:'주간 수업 시간표.pdf',ext:'pdf',text:'시간표 담당 교사 교과 시간 월 화 수 목 금 1교시 2교시 3교시',layout:{dayHeaders:5,classCodes:10,periodMarkers:6}}},

  {id:'live-comcigan',expected:'live',input:{name:'컴시간 변경시간표.pdf',ext:'pdf',text:'컴시간 이번 주 변경 시간표 보강 결강 대체 1교시 2교시 월 화 수 목 금',layout:{dayHeaders:5,periodMarkers:5,classCodes:8}}},
  {id:'live-replacement',expected:'live',input:{name:'대체시간표.xlsx',ext:'xlsx',text:'이번 주 변경표 대체 보강 결강 월 화 수 목 금 1교시 2교시',layout:{tableRows:12,dayHeaders:5,classCodes:7,periodMarkers:5}}},
  {id:'live-weekly',expected:'live',input:{name:'주간 변경 시간표.pdf',ext:'pdf',text:'주간 시간표 변경 시간표 대체 수업 보강 결강 컴시간 월 화 수 목 금',layout:{dayHeaders:5,classCodes:6,periodMarkers:4}}},

  {id:'assessment-music',expected:'assessment',input:{name:'2026 음악 평가계획.docx',ext:'docx',text:'수행평가 평가 계획 반영 비율 40% 평가 방법 성취 기준 지필평가 고사'}},
  {id:'assessment-performance',expected:'assessment',input:{name:'수행평가 계획.hwpx',ext:'hwpx',text:'수행 평가 평가 방법 배점 반영 비율 성취 기준 채점 기준 평가 계획'}},
  {id:'assessment-grade',expected:'assessment',input:{name:'학업성적 평가계획.pdf',ext:'pdf',text:'학업성적 고사 지필 평가 수행 평가 평가 계획 반영 비율 성취 기준 평가 방법'}},

  {id:'admin-roles',expected:'admin',input:{name:'교직원 업무분장.xlsx',ext:'xlsx',text:'업무 분장 담당 업무 담당자 담당 부서 제출 회신 보고 공문 기안 결재',layout:{tableRows:30}}},
  {id:'admin-plan',expected:'admin',input:{name:'부서 업무계획.docx',ext:'docx',text:'담당 업무 담당 부서 회의 협의회 연수 제출 보고 신청 등록 공문 결재'}},
  {id:'admin-official',expected:'admin',input:{name:'공문 처리 목록.xlsx',ext:'xlsx',text:'공문 기안 결재 회신 제출 담당자 담당 부서 보고 등록',layout:{tableRows:18}}},

  {id:'club-creative',expected:'club',input:{name:'창체 동아리 운영계획.pdf',ext:'pdf',text:'창의적 체험활동 창체 동아리 밴드 합주 공연 운영 국제 교류'}},
  {id:'club-band',expected:'club',input:{name:'밴드 동아리 계획.docx',ext:'docx',text:'동아리 밴드 합주 공연 창체 활동 운영 연습 발표'}},
  {id:'club-exchange',expected:'club',input:{name:'국제교류 활동계획.hwpx',ext:'hwpx',text:'국제 교류 자매 학교 동아리 창의적 체험활동 공동 활동 공연'}},

  {id:'student-roster',expected:'student',input:{name:'학생 명렬 합성샘플.xlsx',ext:'xlsx',text:'학생 명렬 학번 성명 학년 반 번호 성명 학생 상담 기록',layout:{tableRows:24}}},
  {id:'student-classlist',expected:'student',input:{name:'학급 명부.xlsx',ext:'xlsx',text:'학급 명부 학생 명단 학번 번호 성명 학년 반',layout:{tableRows:32}}},
  {id:'student-counsel',expected:'student',input:{name:'상담 기록 합성샘플.docx',ext:'docx',text:'학생 상담 기록 학번 성명 학년 반 학생 상담 관찰 기록'}},

  {id:'schoolplan-master',expected:'schoolplan',input:{name:'학교교육계획.pdf',ext:'pdf',text:'학교 교육 계획 교육 과정 운영 교육활동 계획 학사 일정 평가 업무 분장'}},
  {id:'schoolplan-curriculum',expected:'schoolplan',input:{name:'교육과정 운영계획.hwpx',ext:'hwpx',text:'교육 과정 운영 학교 교육 계획 교육활동 계획 학사 일정 평가 계획 업무 분장'}},
  {id:'schoolplan-operation',expected:'schoolplan',input:{name:'학교 운영 계획.pdf',ext:'pdf',text:'학교 운영 계획 학교 교육 계획 교육 과정 운영 학사 일정 평가 업무 분장 교육활동 계획'}},
];

const rows=fixtures.map(f=>{const r=D.classifyDocument(f.input);return{id:f.id,expected:f.expected,actual:r.classId,confidence:r.confidence,mixed:r.mixed}});
const correct=rows.filter(r=>r.expected===r.actual).length;
const accuracy=correct/rows.length;
assert.equal(accuracy,1,`synthetic document classification accuracy regressed: ${correct}/${rows.length}\n${JSON.stringify(rows,null,2)}`);
rows.forEach(r=>assert.ok(r.confidence>=.70,`${r.id} confidence unexpectedly low: ${r.confidence}`));

const classIds=[...new Set(fixtures.map(f=>f.expected))];
const perClass=Object.fromEntries(classIds.map(id=>{
  const subset=rows.filter(r=>r.expected===id),hits=subset.filter(r=>r.actual===id).length;
  const recall=hits/subset.length;
  assert.equal(recall,1,`${id} synthetic recall regressed: ${hits}/${subset.length}`);
  return[id,{count:subset.length,recall}];
}));

// Adversarial no-PII cases: ambiguity, weak evidence, degraded extraction and
// sensitive/mismatched suggestions must never become broader automatic actions.
const vague=D.classifyDocument({name:'교내 안내 자료.pdf',ext:'pdf',text:'안내 참고 교육 활동 자료'});
assert.equal(vague.classId,'unknown','weak generic evidence must stay unclassified');
const ambiguous=D.classifyDocument({name:'종합 업무 평가 자료.pdf',ext:'pdf',text:'업무 분장 담당 업무 담당자 담당 부서 공문 기안 결재 수행 평가 지필 평가 평가 계획 반영 비율 평가 방법 성취 기준'});
assert.equal(ambiguous.mixed,true,'balanced admin/assessment evidence should be marked mixed');
assert.ok(ambiguous.confidence<=.84,'mixed classification confidence must stay capped');
const mixedMismatch=D.fuseSuggestion({baseConfidence:.99,docClass:ambiguous.classId,docConfidence:ambiguous.confidence,extractionQuality:.99,kind:ambiguous.classId==='admin'?'assessment':'admin',mixed:true});
assert.equal(mixedMismatch.auto,false,'ambiguous mixed documents must never broaden auto-apply to another domain');
const degraded=D.extractionQuality({text:'수행평가 □□□□ 30% ※※※ 9월 3일',method:'docx-native'});
assert.ok(degraded<.72,'degraded native extraction must remain below auto-apply quality threshold');
const degradedAuto=D.fuseSuggestion({baseConfidence:.99,docClass:'assessment',docConfidence:.99,extractionQuality:degraded,kind:'assessment'});
assert.equal(degradedAuto.auto,false,'degraded extraction must require review despite strong document classification');
const sensitive=D.fuseSuggestion({baseConfidence:.99,docClass:'student',docConfidence:.99,extractionQuality:.99,kind:'admin',sensitive:true});
assert.equal(sensitive.auto,false,'student/sensitive material must never auto-apply');
const schoolplanMixed=D.fuseSuggestion({baseConfidence:.96,docClass:'schoolplan',docConfidence:.84,extractionQuality:.95,kind:'assessment',mixed:true});
assert.equal(schoolplanMixed.auto,true,'explicit school-plan multi-domain intake may retain bounded auto-apply');

// Measure only deterministic classification cost; file parsing/OCR have separate tests.
// Keep roughly the same total work as the previous benchmark while increasing coverage.
const iterations=1500;
const started=performance.now();
for(let n=0;n<iterations;n++)for(const f of fixtures)D.classifyDocument(f.input);
const elapsedMs=performance.now()-started;
const classifications=iterations*fixtures.length;
const perDocMs=elapsedMs/classifications;
assert.ok(elapsedMs<3500,`document classifier latency regression: ${elapsedMs.toFixed(1)}ms for ${classifications} classifications`);

console.log(JSON.stringify({fixtureCount:fixtures.length,classCount:classIds.length,challengeCount:7,accuracy,perClass,elapsedMs:Number(elapsedMs.toFixed(1)),classifications,perDocMs:Number(perDocMs.toFixed(4))}));
