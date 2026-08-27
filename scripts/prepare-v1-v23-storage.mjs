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

const oldHash23="  async function hashFile23(file){const ab=await file.arrayBuffer(),dig=await crypto.subtle.digest('SHA-256',ab);return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')}";
const newHash23="  const FILE_HASH_CACHE23=globalThis.TeacherOSFileHashCache||(globalThis.TeacherOSFileHashCache=new WeakMap());\n  async function hashFile23(file){if(FILE_HASH_CACHE23.has(file))return FILE_HASH_CACHE23.get(file);const p=(async()=>{const ab=await file.arrayBuffer(),dig=await crypto.subtle.digest('SHA-256',ab);return [...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')})();FILE_HASH_CACHE23.set(file,p);try{return await p}catch(e){FILE_HASH_CACHE23.delete(file);throw e}}";
if(src.includes(oldHash23))src=src.replace(oldHash23,newHash23);
else if(!src.includes('TeacherOSFileHashCache'))throw new Error('v1 v23 hash cache preparation found no expected hash source');
if(!src.includes('FILE_HASH_CACHE23.has(file)')||!src.includes('FILE_HASH_CACHE23.delete(file)'))throw new Error('v1 v23 hash cache preparation incomplete');

const oldSuggestionKey="x=>`${x.kind}|${x.date||''}|${x.day||''}|${x.period||''}|${x.title||x.label||''}|${x.profileType||''}|${x.target||''}`";
const sourceAwareKey="x=>`${x.source||''}|${x.kind}|${x.date||''}|${x.day||''}|${x.period||''}|${x.title||x.label||''}|${x.profileType||''}|${x.target||''}`";
if(src.includes(oldSuggestionKey))src=src.split(oldSuggestionKey).join(sourceAwareKey);
if(src.includes(oldSuggestionKey))throw new Error('v1 v23 preparation left source-blind suggestion dedupe');
if(!src.includes(sourceAwareKey))throw new Error('v1 v23 preparation found no source-aware suggestion dedupe');

const oldSensitive="sensitive=privacy.length>0&&doc.classId==='student'";
const privacySensitive='sensitive=privacy.length>0';
if(src.includes(oldSensitive))src=src.replace(oldSensitive,privacySensitive);
else if(!src.includes(privacySensitive))throw new Error('v1 v23 privacy guard found no expected analysis sensitivity source');
const oldCorrected="sensitive:classId==='student'";
const correctedSensitive="sensitive:classId==='student'||(report.privacy||[]).length>0";
if(!src.includes(correctedSensitive)){
  if(src.includes(oldCorrected))src=src.replace(oldCorrected,correctedSensitive);
  else throw new Error('v1 v23 privacy guard found no corrected-class sensitivity source');
}
const oldPrivacyNotice='학생자료로 판정된 파일은 자동 적용을 막았습니다.';
const privacyNotice='개인정보 형태가 감지된 파일은 문서 분류와 관계없이 자동 적용을 막았습니다.';
if(!src.includes(privacyNotice)){
  if(src.includes(oldPrivacyNotice))src=src.replace(oldPrivacyNotice,privacyNotice);
  else throw new Error('v1 v23 privacy guard notice source is missing');
}
for(const token of [privacySensitive,correctedSensitive,privacyNotice])if(!src.includes(token))throw new Error(`v1 v23 privacy guard missing: ${token}`);
if(src.includes(oldSensitive))throw new Error('v1 v23 privacy guard still depends on student classification');

// v23 historically wrapped global render only to refresh its intake/report UI. Route that
// refresh through the shared lifecycle service so later layers do not create another wrapper
// chain. Keep a fallback only for isolated unit tests that load app-v23 without v1 services.
const oldRender23="  boot23();const prevRender23=globalThis.render;if(typeof prevRender23==='function')globalThis.render=function(){const r=prevRender23.apply(this,arguments);setTimeout(()=>{ensureReportUI23();bind23();renderReports23()},0);return r};";
const sharedRender23="  boot23();const lifecycle23=globalThis.TeacherOSLifecycle;\n  if(lifecycle23){\n    lifecycle23.onRender(()=>{ensureReportUI23();bind23();renderReports23()},{defer:true});\n  }else{\n    const fallbackRender23=globalThis.render;if(typeof fallbackRender23==='function')globalThis.render=function(){const r=fallbackRender23.apply(this,arguments);setTimeout(()=>{ensureReportUI23();bind23();renderReports23()},0);return r};\n  }";
if(src.includes(oldRender23))src=src.replace(oldRender23,sharedRender23);
else if(!src.includes('lifecycle23.onRender'))throw new Error('v1 v23 lifecycle preparation found no expected render wrapper');
if(src.includes('const prevRender23=globalThis.render'))throw new Error('v1 v23 lifecycle preparation left historical render wrapper');
for(const token of ['TeacherOSLifecycle','lifecycle23.onRender','fallbackRender23','ensureReportUI23();bind23();renderReports23()'])if(!src.includes(token))throw new Error(`v1 v23 lifecycle preparation missing: ${token}`);

fs.writeFileSync(path,src,'utf8');

const path31='app-v31.js';
let src31=fs.readFileSync(path31,'utf8');
const oldHash31="  async function hash31(file){const dig=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')}";
const newHash31="  const FILE_HASH_CACHE31=globalThis.TeacherOSFileHashCache||(globalThis.TeacherOSFileHashCache=new WeakMap());\n  async function hash31(file){if(FILE_HASH_CACHE31.has(file))return FILE_HASH_CACHE31.get(file);const p=(async()=>{const dig=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return[...new Uint8Array(dig)].map(x=>x.toString(16).padStart(2,'0')).join('')})();FILE_HASH_CACHE31.set(file,p);try{return await p}catch(e){FILE_HASH_CACHE31.delete(file);throw e}}";
if(src31.includes(oldHash31))src31=src31.replace(oldHash31,newHash31);
else if(!src31.includes('FILE_HASH_CACHE31'))throw new Error('v1 v31 hash cache preparation found no expected hash source');
for(const token of ['TeacherOSFileHashCache','FILE_HASH_CACHE31.has(file)','FILE_HASH_CACHE31.delete(file)','imports31(y).find(x=>x.hash===h)||null'])if(!src31.includes(token))throw new Error(`v1 v31 hash cache preparation missing: ${token}`);
fs.writeFileSync(path31,src31,'utf8');

console.log(`Prepared v1 shared storage/lifecycle, source-aware provenance, privacy fail-closed auto-apply, and exact SHA-256 upload hash reuse (${before} direct state write${before===1?'':'s'} converted).`);
