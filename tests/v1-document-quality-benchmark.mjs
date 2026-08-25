import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const D=require('../core-v23.js');

// Synthetic, no-PII school-shaped fixtures. These are deliberately compact and
// deterministic so CI can track classifier regressions without storing real school files.
const fixtures=[
  {id:'calendar',expected:'calendar',input:{name:'2026학년도 학사일정.pdf',ext:'pdf',text:'학사 일정\n3월 2일 개학\n5월 15일 체육대회\n7월 20일 방학\n12월 31일 종업'}},
  {id:'timetable',expected:'timetable',input:{name:'교사 시간표.xlsx',ext:'xlsx',text:'시간표 월 화 수 목 금 1교시 2교시 3교시 담당 교사 교과 시간',layout:{tableRows:12,timetableSlots:18,dayHeaders:5,classCodes:12,periodMarkers:7}}},
  {id:'live',expected:'live',input:{name:'컴시간 변경시간표.pdf',ext:'pdf',text:'컴시간 이번 주 변경 시간표 보강 결강 대체 1교시 2교시 월 화 수 목 금',layout:{dayHeaders:5,periodMarkers:5,classCodes:8}}},
  {id:'assessment',expected:'assessment',input:{name:'2026 음악 평가계획.docx',ext:'docx',text:'수행평가 평가 계획 반영 비율 40% 평가 방법 성취 기준 지필평가 고사'}},
  {id:'admin',expected:'admin',input:{name:'교직원 업무분장.xlsx',ext:'xlsx',text:'업무 분장 담당 업무 담당자 담당 부서 제출 회신 보고 공문 기안 결재',layout:{tableRows:30}}},
  {id:'club',expected:'club',input:{name:'창체 동아리 운영계획.pdf',ext:'pdf',text:'창의적 체험활동 창체 동아리 밴드 합주 공연 운영 국제 교류'}},
  {id:'student',expected:'student',input:{name:'학생 명렬 합성샘플.xlsx',ext:'xlsx',text:'학생 명렬 학번 성명 학년 반 번호 성명 학생 상담 기록',layout:{tableRows:24}}},
  {id:'schoolplan',expected:'schoolplan',input:{name:'학교교육계획.pdf',ext:'pdf',text:'학교 교육 계획 교육 과정 운영 교육활동 계획 학사 일정 평가 업무 분장'}},
];

const rows=fixtures.map(f=>{const r=D.classifyDocument(f.input);return{id:f.id,expected:f.expected,actual:r.classId,confidence:r.confidence,mixed:r.mixed}});
const correct=rows.filter(r=>r.expected===r.actual).length;
const accuracy=correct/rows.length;
assert.equal(accuracy,1,`synthetic document classification accuracy regressed: ${correct}/${rows.length}\n${JSON.stringify(rows,null,2)}`);
rows.forEach(r=>assert.ok(r.confidence>=.70,`${r.id} confidence unexpectedly low: ${r.confidence}`));

// Measure only deterministic classification cost; file parsing/OCR have separate tests.
// The generous ceiling catches accidental algorithmic blow-ups while avoiding CI noise.
const iterations=4000;
const started=performance.now();
for(let n=0;n<iterations;n++)for(const f of fixtures)D.classifyDocument(f.input);
const elapsedMs=performance.now()-started;
const classifications=iterations*fixtures.length;
const perDocMs=elapsedMs/classifications;
assert.ok(elapsedMs<3500,`document classifier latency regression: ${elapsedMs.toFixed(1)}ms for ${classifications} classifications`);

console.log(JSON.stringify({fixtureCount:fixtures.length,accuracy,elapsedMs:Number(elapsedMs.toFixed(1)),classifications,perDocMs:Number(perDocMs.toFixed(4))}));
