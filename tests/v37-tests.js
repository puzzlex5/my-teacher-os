const fs=require('fs');const assert=require('assert');
const app=fs.readFileSync(require('path').join(__dirname,'..','app-v37.js'),'utf8');
const index=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
assert(app.includes('NEIS LOCAL ADAPTER · v0.37'));
assert(app.includes('학생 이름과 원문 행은 Teacher OS로 전달하지 않습니다'));
assert(app.includes("source==='Desktop Bridge 자동감지'"));
assert(index.includes('app-v37.js'));
assert(index.includes('app-v37.css'));
console.log('v37 NEIS local adapter UI tests passed');
