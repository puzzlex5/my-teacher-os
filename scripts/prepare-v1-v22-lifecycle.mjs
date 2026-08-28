import fs from 'node:fs';

function replaceOnce(src,from,to,label){
  if(src.includes(from))return src.replace(from,to);
  if(src.includes(to))return src;
  throw new Error(`v1 v22 lifecycle preparation failed (${label})`);
}

const appPath='app-v22.js';
let app=fs.readFileSync(appPath,'utf8');
const legacyValid="  function validState22(obj){return !!obj&&typeof obj==='object'&&!Array.isArray(obj)&&!!obj.years&&typeof obj.years==='object'&&!Array.isArray(obj.years)&&Object.values(obj.years).every(y=>!!y&&typeof y==='object'&&!Array.isArray(y))}";
const guardedValid="  function validState22(obj){return !!obj&&typeof obj==='object'&&!Array.isArray(obj)&&!!obj.years&&typeof obj.years==='object'&&!Array.isArray(obj.years)&&Object.values(obj.years).every(y=>!!y&&typeof y==='object'&&!Array.isArray(y))&&((obj.currentYear===null||obj.currentYear===undefined||obj.currentYear==='')||Object.prototype.hasOwnProperty.call(obj.years,String(obj.currentYear)))}";
app=replaceOnce(app,legacyValid,guardedValid,'app-v22 active-year recovery guard');
const legacy="  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureUI();wrapJSONImport();renderRecovery()},0);return r};";
const shared="  const lifecycle22=globalThis.TeacherOSLifecycle;\n  if(lifecycle22){\n    lifecycle22.onRender(()=>{ensureUI();wrapJSONImport();renderRecovery()},{defer:true});\n  }else{\n    const fallbackRender22=globalThis.render;if(typeof fallbackRender22==='function')globalThis.render=function(){const r=fallbackRender22.apply(this,arguments);setTimeout(()=>{ensureUI();wrapJSONImport();renderRecovery()},0);return r};\n  }";
app=replaceOnce(app,legacy,shared,'app-v22 render hook');
if(app.includes('const prevRender=globalThis.render'))throw new Error('v22 still carries the historical direct render wrapper');
for(const token of ['TeacherOSLifecycle','lifecycle22.onRender','fallbackRender22','ensureUI();wrapJSONImport();renderRecovery()','Object.prototype.hasOwnProperty.call(obj.years,String(obj.currentYear))']){
  if(!app.includes(token))throw new Error(`prepared v22 missing ${token}`);
}
fs.writeFileSync(appPath,app,'utf8');
console.log('Prepared v1 v22 local recovery to use shared lifecycle and reject dangling active-year references.');
