import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v23.js','utf8');
let n=0;
const ok=(value,message)=>{assert.ok(value,message);n++};

ok(app.includes('const lifecycle23=globalThis.TeacherOSLifecycle'),'v23 reads the shared lifecycle service');
ok(app.includes('lifecycle23.onRender(()=>{ensureReportUI23();bind23();renderReports23()},{defer:true})'),'v23 document intake UI refresh is registered as a deferred render hook');
ok(app.includes('const fallbackRender23=globalThis.render'),'isolated environments retain a legacy fallback');
ok(!app.includes('const prevRender23=globalThis.render'),'historical v23 render wrapper is removed from the prepared runtime');
ok(app.includes('boot23();'),'initial document intake boot remains intact');

console.log(`v1 v23 shared lifecycle checks passed (${n} assertions)`);
