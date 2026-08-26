import fs from 'node:fs';

const path='app-v18.js';
let src=fs.readFileSync(path,'utf8');

const replacements=[
  ["const ev=(y.calendarEvents||[]).find(x=>x.date===s.date&&x.title===s.title);","const ev=(y.calendarEvents||[]).find(x=>x.source===s.source&&x.date===s.date&&x.title===s.title);"],
  ["const a=(y.assessments||[]).find(x=>x.name===s.title&&x.due===(s.date||''));","const a=(y.assessments||[]).find(x=>x.source===s.source&&x.name===s.title&&x.due===(s.date||''));"],
  ["const p=(y.projects||[]).find(x=>x.name===s.title&&x.due===(s.date||''));","const p=(y.projects||[]).find(x=>x.source===s.source&&x.name===s.title&&x.due===(s.date||''));"]
];

let changed=false;
for(const [oldText,newText] of replacements){
  if(src.includes(newText))continue;
  if(!src.includes(oldText))throw new Error(`v18 source-link preparation anchor missing: ${oldText}`);
  src=src.replace(oldText,newText);
  changed=true;
}

if(changed)fs.writeFileSync(path,src);
console.log(changed?'v18 enrichment now preserves document source identity':'v18 source-aware enrichment already prepared');
