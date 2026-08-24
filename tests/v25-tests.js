const fs=require('fs');
const R=require('../core-v25.js');
const goodEvidence=[
  {id:'e1',date:'2026-04-12',text:'모둠 합주에서 리듬이 맞지 않는 부분을 스스로 찾아 반복 연습하고 친구에게 박자를 설명함.'},
  {id:'e2',date:'2026-05-03',text:'합주 발표에서 다른 파트의 소리를 들으며 자신의 연주 세기를 조절하고 모둠원과 시작 박자를 맞춤.'}
];
const good=R.analyzeDraft({area:'subject',evidence:goodEvidence,text:'모둠 합주에서 리듬이 맞지 않는 부분을 스스로 찾아 반복 연습하고 친구에게 박자를 설명함. 이후 합주 발표에서는 다른 파트의 소리를 들으며 연주 세기를 조절하고 모둠원과 시작 박자를 맞추는 모습이 관찰됨.'});
if(good.critical)throw new Error('grounded draft must not be critical');
if(good.score<75)throw new Error('grounded draft quality unexpectedly low: '+good.score);
if(good.dimensions.grounding<25)throw new Error('grounding score too low');
const noEvidence=R.analyzeDraft({area:'subject',evidence:[],text:'수업에 적극적으로 참여하며 탐구 역량이 향상됨.'});
if(!noEvidence.critical||!noEvidence.issues.some(x=>x.code==='NO_EVIDENCE'))throw new Error('missing evidence must be critical');
const prohibited=R.analyzeDraft({area:'subject',evidence:goodEvidence,text:'모둠 합주에 참여하고 교외 대회 수상 실적을 바탕으로 탁월한 음악적 역량을 보임.'});
if(!prohibited.critical||!prohibited.issues.some(x=>x.code==='PROHIBITED'))throw new Error('prohibited expression guard missing');
const unsupported=R.analyzeDraft({area:'subject',evidence:goodEvidence,text:'모둠 합주에서 반복 연습함. 인공지능 작곡 프로그램을 독학하여 전문 작곡가 수준의 작품을 완성함.'});
if(!unsupported.issues.some(x=>x.code==='UNSUPPORTED'))throw new Error('unsupported sentence must be flagged');
const app=fs.readFileSync('app-v25.js','utf8'),css=fs.readFileSync('app-v25.css','utf8'),idx=fs.readFileSync('index.html','utf8'),lib=JSON.parse(fs.readFileSync('school-record-quality-library.json','utf8'));
for(const token of ['QUALITY GATE','현재 초안 품질검사','공식 기준 보기','합격 가능성 점수','qualityCheck','function saveMain25(){globalThis.TeacherOSStorage.writeJSON(KEY,state)}'])if(!app.includes(token))throw new Error('v25 app missing '+token);
if(/localStorage\.setItem\(KEY\s*,/.test(app))throw new Error('v0.25 quality snapshot must use shared TeacherOSStorage');
if(!css.includes('@media(max-width:780px)'))throw new Error('v25 mobile CSS missing');
if(!Array.isArray(lib.sources)||lib.sources.length<4)throw new Error('official quality source library too small');
if(!lib.sources.some(x=>x.authority==='rule'&&x.publisher==='교육부'))throw new Error('MOE rule source missing');
if(!idx.includes('core-v25.js')||!idx.includes('app-v25.js')||!idx.includes('app-v25.css'))throw new Error('v25 loader missing');
console.log('v0.25 grounded school-record quality tests passed');
