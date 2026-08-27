import fs from 'node:fs';

function replaceOnce(src,from,to,label){
  if(src.includes(from))return src.replace(from,to);
  if(src.includes(to))return src;
  throw new Error(`v1 v23 lifecycle preparation failed (${label})`);
}

const appPath='app-v23.js';
let app=fs.readFileSync(appPath,'utf8');
const legacy="  boot23();const prevRender23=globalThis.render;if(typeof prevRender23==='function')globalThis.render=function(){const r=prevRender23.apply(this,arguments);setTimeout(()=>{ensureReportUI23();bind23();renderReports23()},0);return r};";
const shared="  boot23();const lifecycle23=globalThis.TeacherOSLifecycle;\n  if(lifecycle23){\n    lifecycle23.onRender(()=>{ensureReportUI23();bind23();renderReports23()},{defer:true});\n  }else{\n    const fallbackRender23=globalThis.render;if(typeof fallbackRender23==='function')globalThis.render=function(){const r=fallbackRender23.apply(this,arguments);setTimeout(()=>{ensureReportUI23();bind23();renderReports23()},0);return r};\n  }";
app=replaceOnce(app,legacy,shared,'app-v23 render hook');
if(app.includes('const prevRender23=globalThis.render'))throw new Error('v23 still carries the historical direct render wrapper');
for(const token of ['TeacherOSLifecycle','lifecycle23.onRender','fallbackRender23','ensureReportUI23();bind23();renderReports23()']){
  if(!app.includes(token))throw new Error(`prepared v23 missing ${token}`);
}
fs.writeFileSync(appPath,app,'utf8');
console.log('Prepared v1 v23 document intake UI to use the shared render lifecycle with isolated-test fallback.');
