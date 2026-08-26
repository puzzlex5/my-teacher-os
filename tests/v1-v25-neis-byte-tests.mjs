import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TextEncoder} from 'node:util';

const source=fs.readFileSync('app-v25.js','utf8');
for(const token of ['SUBJECT_NEIS_LIMIT25=1500','function neisBytes25(','function analyze25(','code:\'NEIS_LIMIT\'','neisBytes:res.neisBytes','NEIS ${res.neisBytes}/${res.neisLimit}Byte']){
  assert.ok(source.includes(token),`v25 NEIS byte guard missing: ${token}`);
}

const instrumented=source.replace(/\}\)\(\);\s*$/,'globalThis.__v25test={neisBytes25,analyze25};})();');
const baseResult=()=>({score:90,level:'매우 안정',critical:false,issues:[],strengths:[],dimensions:{grounding:35,specificity:15,growth:15,process:15,clarity:10,safety:10},unsupportedSentences:[],evidenceCount:1,dateCount:1});
const context={
  console,
  TextEncoder,
  setTimeout:()=>0,
  clearTimeout:()=>{},
  alert:()=>{},
  document:{querySelector:()=>null,querySelectorAll:()=>[],body:{addEventListener:()=>{}}},
  TeacherOSRecordQuality:{analyzeDraft:()=>baseResult()},
  TeacherOSStorage:{writeJSON:()=>{}},
  KEY:'test',state:{},cur:()=>null,
};
context.globalThis=context;
vm.runInNewContext(instrumented,context,{filename:'app-v25.js'});
const {neisBytes25,analyze25}=context.__v25test;

assert.equal(neisBytes25('가'),3,'Hangul must count as 3 bytes in NEIS accounting');
assert.equal(neisBytes25('A1 '),3,'ASCII letters, digits and spaces must count as 1 byte each');
assert.equal(neisBytes25('가\nA'),5,'Enter must count as 1 byte');
assert.equal(neisBytes25('가\r\nA'),5,'CRLF must normalize to one NEIS Enter byte');

const exact=analyze25({area:'subject',text:'가'.repeat(500),evidence:[]});
assert.equal(exact.neisBytes,1500);
assert.equal(exact.neisLimit,1500);
assert.equal(exact.critical,false,'exact 1500-byte subject draft must remain allowed');
assert.ok(!exact.issues.some(x=>x.code==='NEIS_LIMIT'));

const over=analyze25({area:'subject',text:'가'.repeat(501),evidence:[]});
assert.equal(over.neisBytes,1503);
assert.equal(over.neisLimit,1500);
assert.equal(over.critical,true,'subject draft over 1500 bytes must fail closed');
assert.equal(over.level,'최종 사용 금지');
assert.ok(over.issues.some(x=>x.code==='NEIS_LIMIT'));
assert.equal(over.dimensions.safety,0);
assert.equal(over.score,80,'NEIS limit violation must remove the prior safety score');

const behavior=analyze25({area:'behavior',text:'가'.repeat(501),evidence:[]});
assert.equal(behavior.neisLimit,null,'unverified area limits must not be guessed');
assert.ok(!behavior.issues.some(x=>x.code==='NEIS_LIMIT'),'only verified subject limit is enforced');

console.log('v1 NEIS byte accounting verified: Hangul 3B, ASCII/Enter 1B, subject 1500B fail-closed');
