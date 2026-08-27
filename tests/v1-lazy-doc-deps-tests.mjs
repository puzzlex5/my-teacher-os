import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync('v1-dependency-loader.js','utf8');
const shell=fs.readFileSync('app-v05.html','utf8');
const app=fs.readFileSync('app-v23.js','utf8');
const legacy=fs.readFileSync('dist-v1/legacy.html','utf8');
const bundle=fs.readFileSync('dist-v1/index.html','utf8');

for(const name of ['xlsx','mammoth','jszip']){
  assert.ok(loader.includes(name),`dependency loader missing ${name}`);
}
assert.ok(loader.includes("['xlsx','xls','csv']"),'spreadsheet extensions must lazy-load XLSX');
assert.ok(loader.includes("ext==='docx'"),'DOCX must lazy-load mammoth');
assert.ok(loader.includes("['hwpx','pptx']"),'HWPX/PPTX must lazy-load JSZip');
assert.ok(loader.includes('Promise.all(names.map(load))'),'independent document helpers should load in parallel');

assert.ok(shell.includes('v1-dependency-loader.js'),'prepared v1 shell must include local dependency loader');
assert.ok(shell.includes('v1-lifecycle-service.js'),'prepared v1 shell must load shared lifecycle service');
assert.ok(shell.indexOf('v1-lifecycle-service.js')<shell.indexOf('core-v05.js'),'shared lifecycle service must load before historical app layers');
assert.ok(!/src="https:\/\/cdn\.jsdelivr\.net\/npm\/(xlsx|mammoth|jszip)/.test(shell),'prepared v1 shell must not eagerly load document libraries');
assert.ok(app.includes('TeacherOSDeps.ensureForFiles(files)'),'v23 analysis must ensure required dependencies before parsing files');
assert.ok(app.includes('문서 분석 도구를 불러오지 못했습니다.'),'dependency failure must be visible instead of silent');

for(const [name,html] of [['legacy',legacy],['bundle',bundle]]){
  assert.ok(!/src="https:\/\/cdn\.jsdelivr\.net\/npm\/(xlsx|mammoth|jszip)/.test(html),`${name} preview must not eagerly request document libraries`);
  assert.ok(html.includes('v1-dependency-loader.js'),`${name} preview must load the local lazy dependency loader`);
  assert.ok(html.includes('v1-lifecycle-service.js'),`${name} preview must load the shared lifecycle service`);
}
console.log('v1 lazy document dependency and lifecycle-loader tests passed');
