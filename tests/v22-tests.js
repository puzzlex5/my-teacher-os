const fs=require('fs');
const js=fs.readFileSync('app-v22.js','utf8');
const css=fs.readFileSync('app-v22.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const required=[
  "DB_NAME='myTeacherOS.recovery'",
  "const MAX_SNAPSHOTS=5",
  "createSnapshot('preImport')",
  "createSnapshot('preRestore')",
  "createSnapshot('daily')",
  "TeacherOSStorage.readJSON(DATA_KEY,()=>null)",
  "TeacherOSStorage.writeJSON(DATA_KEY,obj)",
  "function validState22(obj)",
  "!Array.isArray(obj)",
  "!Array.isArray(obj.years)",
  "Object.values(obj.years).every(y=>!!y&&typeof y==='object'&&!Array.isArray(y))",
  "Object.prototype.hasOwnProperty.call(obj.years,String(obj.currentYear))",
  "if(!validState22(obj))throw new Error('현재 Teacher OS 데이터 형식이 올바르지 않습니다.')",
  "if(!validState22(obj))throw new Error('복구지점 형식이 올바르지 않습니다.')",
  'JSON 복구 직전에 현재 데이터를',
  '브라우저 사이트 데이터 삭제·기기 분실·초기화 시 이 복구지점도 함께 사라집니다'
];
for(const token of required)if(!js.includes(token))throw new Error('v0.22 missing: '+token);
const fnMatch=js.match(/function validState22\(obj\)\{([^}]*)\}/);
if(!fnMatch)throw new Error('v0.22 validState22 function body missing');
const validState22=new Function('obj',fnMatch[1]);
if(!validState22({years:{2026:{year:2026}}}))throw new Error('v0.22 rejects valid year-map recovery state');
if(!validState22({currentYear:2026,years:{2026:{year:2026}}}))throw new Error('v0.22 rejects valid active-year recovery state');
for(const bad of [null,[],{},{years:[]},{years:{2026:null}},{years:{2026:[]}},{years:{2026:'broken'}},{currentYear:2027,years:{2026:{year:2026}}}]){
  if(validState22(bad))throw new Error('v0.22 accepts malformed recovery state: '+JSON.stringify(bad));
}
if(js.includes('localStorage.setItem(DATA_KEY')||js.includes('localStorage.getItem(DATA_KEY'))throw new Error('v0.22 recovery state bypasses shared storage');
if(/fetch\s*\(|XMLHttpRequest|WebSocket/.test(js))throw new Error('v0.22 local recovery must not send snapshot data over network');
if(!css.includes('@media(max-width:680px)')||!css.includes('grid-template-columns:1fr'))throw new Error('v0.22 mobile recovery styles missing');
if(!index.includes('app-v22.js')||!index.includes('app-v22.css'))throw new Error('v0.22 loader missing');
console.log('v0.22 local recovery snapshot tests passed with shared-storage, nested malformed-state, and active-year guards');