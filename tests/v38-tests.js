const fs=require('fs');const path=require('path');const assert=require('assert');
const app=fs.readFileSync(path.join(__dirname,'..','app-v38.js'),'utf8');
const index=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert(app.includes('K-EDUFINE LOCAL ADAPTER · v0.38'));
assert(app.includes('문서 본문, 결재 의견, 개인 이름, 원문 행은 Teacher OS로 전달하지 않습니다'));
assert(app.includes("source==='Desktop Bridge 자동감지'"));
assert(index.includes('app-v38.js'));
assert(index.includes('app-v38.css'));
console.log('v38 K-에듀파인 local adapter UI tests passed');
