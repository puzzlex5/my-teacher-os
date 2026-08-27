import assert from 'node:assert';
import fs from 'node:fs';

const js=fs.readFileSync('app-v18.js','utf8');

const required=[
  "x.source===s.source&&x.date===s.date&&x.title===s.title",
  "x.source===s.source&&x.name===s.title&&x.due===(s.date||'')",
  'const lifecycle18=globalThis.TeacherOSLifecycle',
  'lifecycle18.onRender(renderCapabilities,{defer:true})'
];
for(const token of required)assert.ok(js.includes(token),`v18 source/lifecycle guard missing: ${token}`);

assert.ok(!js.includes("find(x=>x.date===s.date&&x.title===s.title)"),'calendar enrichment must not mutate a same-title item from another document');
assert.ok(!js.includes("find(x=>x.name===s.title&&x.due===(s.date||''))"),'assessment/admin enrichment must not mutate an item from another document');
assert.equal((js.match(/lifecycle18\.onRender\(/g)||[]).length,1,'v18 must register exactly one shared render hook');
assert.equal((js.match(/globalThis\.render=function/g)||[]).length,1,'v18 may keep only the isolated-test fallback render wrapper');

const calendar=[
  {source:'A.pdf',date:'2026-09-01',title:'학교축제',scope:'전체'},
  {source:'B.pdf',date:'2026-09-01',title:'학교축제',scope:'2학년'}
];
const suggestion={source:'B.pdf',date:'2026-09-01',title:'학교축제',scope:'3학년'};
const matched=calendar.find(x=>x.source===suggestion.source&&x.date===suggestion.date&&x.title===suggestion.title);
assert.equal(matched?.source,'B.pdf');
matched.scope=suggestion.scope;
assert.equal(calendar[0].scope,'전체','metadata from B must never mutate A');
assert.equal(calendar[1].scope,'3학년');

console.log('v18 source-aware enrichment and shared lifecycle regression tests passed');
