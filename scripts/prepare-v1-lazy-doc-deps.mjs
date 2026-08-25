import fs from 'node:fs';

const file='app-v23.js';
let source=fs.readFileSync(file,'utf8');
const marker="    try{for(let i=0;i<files.length;i++){";
if(!source.includes(marker))throw new Error('v1 lazy dependency marker missing in app-v23.js');
if(source.includes('TeacherOSDeps.ensureForFiles(files)'))throw new Error('v1 lazy dependency guard already applied');
const replacement="    try{await globalThis.TeacherOSDeps.ensureForFiles(files)}catch(e){setStatus23(`<b>문서 분석 도구를 불러오지 못했습니다.</b> · ${esc23(e?.message||e)}`);if(btn)btn.disabled=false;running23=false;return}\n    try{for(let i=0;i<files.length;i++){";
source=source.replace(marker,replacement);
fs.writeFileSync(file,source);
console.log('Prepared v1 app-v23 lazy document dependencies');
