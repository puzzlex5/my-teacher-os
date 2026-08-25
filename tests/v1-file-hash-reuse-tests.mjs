import fs from 'node:fs';
import assert from 'node:assert/strict';

const v23=fs.readFileSync('app-v23.js','utf8');
const v31=fs.readFileSync('app-v31.js','utf8');

for(const [label,src,tokens] of [
  ['v23 intake',v23,['TeacherOSFileHashCache','FILE_HASH_CACHE23.has(file)','FILE_HASH_CACHE23.set(file,p)','FILE_HASH_CACHE23.delete(file)']],
  ['v31 retention',v31,['TeacherOSFileHashCache','FILE_HASH_CACHE31.has(file)','FILE_HASH_CACHE31.set(file,p)','FILE_HASH_CACHE31.delete(file)']]
]){
  for(const token of tokens)assert.ok(src.includes(token),`${label} missing exact hash-cache token: ${token}`);
}

assert.ok(v23.includes("crypto.subtle.digest('SHA-256',ab)"),'v23 must continue using SHA-256');
assert.ok(v31.includes("crypto.subtle.digest('SHA-256',await file.arrayBuffer())"),'v31 must continue using SHA-256 on cache miss');
assert.ok(v31.includes('imports31(y).find(x=>x.hash===h)||null'),'retention must continue matching the exact analyzed hash');
assert.equal((v23.match(/globalThis\.TeacherOSFileHashCache/g)||[]).length>=1,true,'v23 exposes shared hash cache');
assert.equal((v31.match(/globalThis\.TeacherOSFileHashCache/g)||[]).length>=1,true,'v31 reuses shared hash cache');
assert.ok(!v31.includes("async function matchImport31(f,y){try{const h=await crypto.subtle.digest"),'retention must not bypass the shared hash helper');

console.log('v1 exact upload hash reuse guard passed');
