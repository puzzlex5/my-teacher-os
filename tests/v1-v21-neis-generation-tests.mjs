import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

const path='app-v21.js';
const src=fs.readFileSync(path,'utf8');
assert.ok(src.includes('const SUBJECT_NEIS_LIMIT21=1500'),'verified subject NEIS byte limit missing');
assert.ok(src.includes('function neisBytes21(text)'),'NEIS byte helper missing');
assert.ok(src.includes('function fitNeis21(text,limit=SUBJECT_NEIS_LIMIT21)'),'NEIS fit helper missing');
assert.ok(src.includes("area==='subject'?fitNeis21(normalized):normalized.slice(0,1600)"),'subject-only byte cap missing');
assert.ok(src.includes('A:finalizeVariant21(a,area)')&&src.includes('B:finalizeVariant21(b,area)')&&src.includes('C:finalizeVariant21(c,area)'),'draft variants do not use NEIS-safe finalization');

const injected=src.replace(/\}\)\(\);\s*$/,"globalThis.__v21test={makeVariants21,neisBytes21,fitNeis21,finalizeVariant21};})();");
const body={addEventListener(){}};
const document={querySelector(){return null},querySelectorAll(){return[]},body};
const context={
  console,
  document,
  state:{version:21,years:{}},
  KEY:'myTeacherOS.v01',
  TeacherOSStorage:{writeJSON(){}},
  setTimeout(){return 0},
  clearTimeout(){},
  TextEncoder,
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(injected,context,{filename:path});
const {makeVariants21,neisBytes21,fitNeis21}=context.__v21test;

assert.equal(neisBytes21('가A1\n'),6,'NEIS byte accounting must keep Hangul=3, ASCII=1, Enter=1');
assert.equal(neisBytes21('가'.repeat(500)),1500,'500 Hangul chars should be exactly 1500 bytes');
assert.ok(neisBytes21(fitNeis21('가'.repeat(501)))<=1500,'fallback clipping exceeds verified NEIS limit');

const rows=Array.from({length:10},(_,i)=>({text:`${i+1}차 수업에서 모둠원과 협력하여 리듬 패턴을 분석하고 연주 표현을 조정하는 과정을 반복적으로 기록함 ${'학습과정을 구체적으로 설명함 '.repeat(5)}`}));
const subject=makeVariants21(rows,'subject');
for(const [key,text] of Object.entries(subject)){
  assert.ok(text.length>0,`${key} subject draft is empty`);
  assert.ok(neisBytes21(text)<=1500,`${key} subject draft exceeds 1500Byte: ${neisBytes21(text)}`);
}

const behavior=makeVariants21(rows,'behavior');
assert.ok(Object.values(behavior).some(text=>neisBytes21(text)>1500),'non-subject areas were unexpectedly forced to the subject-only 1500Byte limit');
assert.ok(Object.values(behavior).every(text=>text.length<=1600),'legacy non-subject character guard changed');

const sentenceSafe=fitNeis21('첫 번째 관찰 문장입니다. '+'두 번째 관찰 문장입니다. '.repeat(120),60);
assert.ok(sentenceSafe.endsWith('.'),'byte fitting should prefer complete sentence boundaries when at least one sentence fits');
assert.ok(neisBytes21(sentenceSafe)<=60,'sentence-boundary fitting exceeds requested limit');

console.log('v1 v21 subject draft generation stays within verified NEIS bytes while preserving non-subject behavior.');
