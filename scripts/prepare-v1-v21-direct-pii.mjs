import fs from 'node:fs';

const path='app-v21.js';
let src=fs.readFileSync(path,'utf8');

const keywordDecl="  const SENSITIVE_RE21=/(질병|진단|약물|정신|우울|자해|가정폭력|이혼|경제사정|기초생활|성폭력|성적지향|종교|장애|주민등록|전화번호)/;";
const piiDecl="  const DIRECT_PII_RE21=/(?:\\b01[016789][- .]?\\d{3,4}[- .]?\\d{4}\\b|\\b\\d{6}[- ]?[1-4]\\d{6}\\b|\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b)/i;";

if(!src.includes(piiDecl)){
  if(!src.includes(keywordDecl))throw new Error('v1 v21 PII preparation failed: sensitive keyword declaration missing');
  src=src.replace(keywordDecl,`${keywordDecl}\n${piiDecl}`);
}

const oldFilter=".filter(r=>r.studentId===studentId&&r.eligible===true&&r.area===area&&EVIDENCE_KINDS21.has(r.kind)&&!SENSITIVE_RE21.test(r.text||''))";
const newFilter=".filter(r=>r.studentId===studentId&&r.eligible===true&&r.area===area&&EVIDENCE_KINDS21.has(r.kind)&&!SENSITIVE_RE21.test(r.text||'')&&!DIRECT_PII_RE21.test(r.text||''))";
if(src.includes(oldFilter))src=src.replace(oldFilter,newFilter);
else if(!src.includes(newFilter))throw new Error('v1 v21 PII preparation failed: evidence filter pattern missing');

for(const token of ['DIRECT_PII_RE21','!DIRECT_PII_RE21.test(r.text||\'\')','EVIDENCE_KINDS21']){
  if(!src.includes(token))throw new Error(`v1 prepared v21 missing: ${token}`);
}

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v21 to exclude direct phone/email/resident-number PII before school-record draft generation.');
