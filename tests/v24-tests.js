const fs=require('fs');
const js=fs.readFileSync('app-v24.js','utf8');
const css=fs.readFileSync('app-v24.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const required=[
  "DEVICE_KEY='myTeacherOS.deviceProfile.v1'",
  "const blankAtBoot=!!globalThis.state&&!state.currentYear&&Object.keys(state.years||{}).length===0",
  "y.subjects=[subject]",
  "if(wasFirst){y.clubs=[];y.roleProfile={roles:[]",
  "state.profile.major=''",
  '같은 사이트 주소를 사용해도 이 브라우저의 학교·교과·업무·학생기록은 다른 사용자와 섞이지 않습니다',
  '이 기기만의 Teacher OS'
];
for(const token of required)if(!js.includes(token))throw new Error('v0.24 missing: '+token);
if(!js.includes("q('#ySubject')")||!js.includes('담당 교과'))throw new Error('Subject personalization field missing');
if(!css.includes('@media(max-width:680px)'))throw new Error('v0.24 mobile style guard missing');
if(!index.includes('app-v24.js')||!index.includes('app-v24.css'))throw new Error('v0.24 loader missing');
if(/localStorage\.clear\s*\(|removeItem\(KEY\)/.test(js))throw new Error('v0.24 must never clear existing Teacher OS data');
console.log('v0.24 personal browser isolation tests passed');
