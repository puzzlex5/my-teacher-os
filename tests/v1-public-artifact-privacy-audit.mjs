import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT=path.resolve('dist-v1');
const TEXT_EXT=new Set(['.html','.js','.css','.json','.txt','.map']);
const FORBIDDEN_SOURCE_EXT=new Set(['.hwp','.hwpx','.pdf','.xlsx','.xls','.docx','.pptx','.csv','.ics','.wav','.mp3','.m4a','.webm']);

const checks=[
  {name:'Korean mobile phone',re:/(?:^|\D)01[016789][-. ]?\d{3,4}[-. ]?\d{4}(?:\D|$)/g,allowContains:['010-1234-5678']},
  {name:'resident registration number',re:/(?:^|\D)\d{6}[- ]?[1-4]\d{6}(?:\D|$)/g},
  {name:'personal email address',re:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,allowContains:['person@example.com']},
  {name:'materialized Comcigan school code',re:/["']schoolCode["']\s*:\s*\d{3,}/g},
  {name:'materialized Comcigan teacher index',re:/["']teacherIndex["']\s*:\s*\d+/g},
  {name:'materialized Comcigan teacher name',re:/["']teacherName["']\s*:\s*["'][^"']{2,}["']/g},
];

function walk(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p)); else out.push(p);
  }
  return out;
}

function findHits(text,rule,applyAllowlist=true){
  rule.re.lastIndex=0;
  const hits=[]; let m;
  while((m=rule.re.exec(text))){
    const raw=m[0];
    const allowed=applyAllowlist&&(rule.allowContains||[]).some(x=>raw.includes(x));
    if(!allowed)hits.push({index:m.index,value:raw.trim().slice(0,80)});
    if(hits.length>=5)break;
    if(m[0].length===0)rule.re.lastIndex++;
  }
  return hits;
}

// Prove the detectors themselves catch representative synthetic sentinels.
assert.ok(findHits('연락처 010-1234-5678',checks[0],false).length,'phone detector regression');
assert.ok(findHits('900101-1234567',checks[1],false).length,'RRN detector regression');
assert.ok(findHits('person@example.com',checks[2],false).length,'email detector regression');
assert.ok(findHits('{"schoolCode":65231}',checks[3],false).length,'Comcigan school-code detector regression');
assert.ok(findHits('{"teacherIndex":37}',checks[4],false).length,'Comcigan teacher-index detector regression');
assert.ok(findHits('{"teacherName":"홍길동"}',checks[5],false).length,'Comcigan teacher-name detector regression');

// Only explicit synthetic sentinels used by product self-tests may be ignored in public code.
assert.equal(findHits('연락처 010-1234-5678',checks[0]).length,0,'synthetic phone sentinel allowlist regression');
assert.equal(findHits('person@example.com',checks[2]).length,0,'synthetic email sentinel allowlist regression');
assert.ok(findHits('연락처 010-9876-5432',checks[0]).length,'realistic phone must not be allowlisted');

if(!fs.existsSync(ROOT))throw new Error('dist-v1 is missing; build the public preview before privacy audit');
const files=walk(ROOT);
assert.ok(files.length>0,'dist-v1 is empty');

const violations=[];
for(const file of files){
  const rel=path.relative(ROOT,file).replaceAll('\\','/');
  const ext=path.extname(file).toLowerCase();
  if(FORBIDDEN_SOURCE_EXT.has(ext)){
    violations.push(`${rel}: source-document/audio file must never be copied into public artifacts`);
    continue;
  }
  if(!TEXT_EXT.has(ext))continue;
  const text=fs.readFileSync(file,'utf8');
  for(const rule of checks){
    const hits=findHits(text,rule);
    if(hits.length)violations.push(`${rel}: ${rule.name} (${hits.length} hit${hits.length>1?'s':''})`);
  }
}

if(violations.length){
  console.error('Teacher OS 1.0 public-artifact privacy audit failed:');
  for(const v of violations)console.error(`- ${v}`);
  console.error('Do not print or commit the matched sensitive values. Inspect the producing step locally and remove the data from dist-v1.');
  process.exit(1);
}

console.log(`Teacher OS 1.0 public-artifact privacy audit passed (${files.length} files scanned; no source documents/audio or sensitive materialized values found).`);
