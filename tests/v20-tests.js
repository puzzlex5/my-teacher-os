const fs=require('fs');
const js=fs.readFileSync('app-v20.js','utf8');
const css=fs.readFileSync('app-v20.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const required=[
  '학생 기록','학교폭력 담당','부장교사','담임교사','교과담당',
  '상담 녹음·상담 원문·학교폭력/생활지도 기록은 생활기록부 근거로 자동 사용하지 않습니다',
  'Xenova/whisper-tiny','audioTo16k','studentRecords','consultations','roleProfile',
  "EVIDENCE_KINDS=new Set(['담임관찰','교과관찰','자율자치활동','진로활동','동아리·창체','수업·평가관찰'])"
];
for(const token of required)if(!js.includes(token))throw new Error('v0.20 missing: '+token);
if(!index.includes('app-v20.js?v=20')||!index.includes('app-v20.css?v=20'))throw new Error('v0.20 loader missing');
if(!css.includes('.sr-layout')||!css.includes('.role-choices'))throw new Error('v0.20 styles missing');
if(js.includes("EVIDENCE_KINDS=new Set(['상담"))throw new Error('Counseling must not be automatic school-record evidence');
console.log('v0.20 role/student-record tests passed');
