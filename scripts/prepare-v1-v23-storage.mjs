import fs from 'node:fs';

const path='app-v23.js';
let src=fs.readFileSync(path,'utf8');
const direct='localStorage.setItem(KEY,JSON.stringify(state))';
const shared='globalThis.TeacherOSStorage.writeJSON(KEY,state)';
const before=(src.match(/localStorage\.setItem\(KEY,JSON\.stringify\(state\)\)/g)||[]).length;
if(before)src=src.split(direct).join(shared);
if(src.includes(direct))throw new Error('v1 v23 storage preparation left direct Teacher OS state writes');
if(!src.includes(shared))throw new Error('v1 v23 storage preparation found no shared TeacherOSStorage state write');
if(src.includes('localStorage.getItem(KEY)'))throw new Error('v1 v23 storage preparation found direct Teacher OS state read');

// Hashing large school documents is expensive. v23 analysis and v31 retention receive the
// same File objects in one upload event, so share the exact SHA-256 Promise through a WeakMap.
// This preserves byte-exact matching while avoiding a second full file read/hash pass.
const oldHash23="  async function hashFile23(file){const ab=await file.arrayBuffer(),dig=await crypto.subtle.digest('SHA-256',ab);return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')}";
const newHash23="  const FILE_HASH_CACHE23=globalThis.TeacherOSFileHashCache||(globalThis.TeacherOSFileHashCache=new WeakMap());\n  async function hashFile23(file){if(FILE_HASH_CACHE23.has(file))return FILE_HASH_CACHE23.get(file);const p=(async()=>{const ab=await file.arrayBuffer(),dig=await crypto.subtle.digest('SHA-256',ab);return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')})();FILE_HASH_CACHE23.set(file,p);try{return await p}catch(e){FILE_HASH_CACHE23.delete(file);throw e}}";
if(src.includes(oldHash23))src=src.replace(oldHash23,newHash23);
else if(!src.includes('TeacherOSFileHashCache'))throw new Error('v1 v23 hash cache preparation found no expected hash source');
if(!src.includes('FILE_HASH_CACHE23.has(file)')||!src.includes('FILE_HASH_CACHE23.delete(file)'))throw new Error('v1 v23 hash cache preparation incomplete');

// Suggestion identity must include source. Different versions/documents can legitimately
// produce the same logical item, and collapsing them here destroys provenance before
// v30 document-version/Undo logic gets a chance to decide which source should win.
const oldSuggestionKey="x=>`${x.kind}|${x.date||''}|${x.day||''}|${x.period||''}|${x.title||x.label||''}|${x.profileType||''}|${x.target||''}`";
const sourceAwareKey="x=>`${x.source||''}|${x.kind}|${x.date||''}|${x.day||''}|${x.period||''}|${x.title||x.label||''}|${x.profileType||''}|${x.target||''}`";
if(src.includes(oldSuggestionKey))src=src.split(oldSuggestionKey).join(sourceAwareKey);
if(src.includes(oldSuggestionKey))throw new Error('v1 v23 preparation left source-blind suggestion dedupe');
if(!src.includes(sourceAwareKey))throw new Error('v1 v23 preparation found no source-aware suggestion dedupe');

fs.writeFileSync(path,src,'utf8');

const path31='app-v31.js';
let src31=fs.readFileSync(path31,'utf8');
const oldHash31="  async function hash31(file){const dig=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')}";
const newHash31="  const FILE_HASH_CACHE31=globalThis.TeacherOSFileHashCache||(globalThis.TeacherOSFileHashCache=new WeakMap());\n  async function hash31(file){if(FILE_HASH_CACHE31.has(file))return FILE_HASH_CACHE31.get(file);const p=(async()=>{const dig=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')})();FILE_HASH_CACHE31.set(file,p);try{return await p}catch(e){FILE_HASH_CACHE31.delete(file);throw e}}";
if(src31.includes(oldHash31))src31=src31.replace(oldHash31,newHash31);
else if(!src31.includes('FILE_HASH_CACHE31'))throw new Error('v1 v31 hash cache preparation found no expected hash source');
for(const token of ['TeacherOSFileHashCache','FILE_HASH_CACHE31.has(file)','FILE_HASH_CACHE31.delete(file)','imports31(y).find(x=>x.hash===h)||null'])if(!src31.includes(token))throw new Error(`v1 v31 hash cache preparation missing: ${token}`);
fs.writeFileSync(path31,src31,'utf8');

console.log(`Prepared v1 shared storage, source-aware provenance, and exact SHA-256 upload hash reuse (${before} direct state write${before===1?'':'s'} converted).`);
