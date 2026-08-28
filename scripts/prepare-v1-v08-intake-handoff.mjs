import fs from 'node:fs';

const path='app-v08.js';
let src=fs.readFileSync(path,'utf8');

const old=`  input.addEventListener('change',()=>{\n    if(input.files?.length)analyzeAndApply();\n  });\n  btn.onclick=analyzeAndApply;\n  btn.textContent='다시 분석';`;
const next=`  function bindLegacyIntakeV8(){\n    if(input.dataset.v23)return;\n    input.addEventListener('change',()=>{\n      if(input.files?.length)analyzeAndApply();\n    });\n    btn.onclick=analyzeAndApply;\n  }\n  setTimeout(bindLegacyIntakeV8,0);\n  btn.textContent='다시 분석';`;

if(src.includes(old)){
  src=src.replace(old,next);
  fs.writeFileSync(path,src);
}else if(!src.includes('function bindLegacyIntakeV8()')||!src.includes('if(input.dataset.v23)return;')){
  throw new Error('v08 intake binding shape changed; refusing unsafe preparation');
}

console.log('Prepared v08 so v23 owns the primary intake event path while v08 remains a fallback.');
