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

// Suggestion identity must include source. Different versions/documents can legitimately
// produce the same logical item, and collapsing them here destroys provenance before
// v30 document-version/Undo logic gets a chance to decide which source should win.
const oldSuggestionKey="x=>`${x.kind}|${x.date||''}|${x.day||''}|${x.period||''}|${x.title||x.label||''}|${x.profileType||''}|${x.target||''}`";
const sourceAwareKey="x=>`${x.source||''}|${x.kind}|${x.date||''}|${x.day||''}|${x.period||''}|${x.title||x.label||''}|${x.profileType||''}|${x.target||''}`";
if(src.includes(oldSuggestionKey))src=src.split(oldSuggestionKey).join(sourceAwareKey);
if(src.includes(oldSuggestionKey))throw new Error('v1 v23 preparation left source-blind suggestion dedupe');
if(!src.includes(sourceAwareKey))throw new Error('v1 v23 preparation found no source-aware suggestion dedupe');

fs.writeFileSync(path,src,'utf8');
console.log(`Prepared v1 app-v23 shared storage boundary (${before} direct state write${before===1?'':'s'} converted) and source-aware suggestion provenance.`);
