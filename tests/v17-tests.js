const fs=require('fs');
const js=fs.readFileSync('app-v17.js','utf8');
const css=fs.readFileSync('app-v17.css','utf8');
const html=fs.readFileSync('app-v17.html','utf8');
for(const token of ['#ttAdd','#ttExceptionAdd','#ttDlg','#ttExceptionDlg','.cell-add','.lesson-target-row']){
  if(!js.includes(token)&&!css.includes(token))throw new Error(`v0.17 hard guard missing ${token}`);
}
if(!js.includes('locked=d.slot'))throw new Error('Detected class/period lock missing');
if(!js.includes('setValues(locked)'))throw new Error('Legacy start overwrite correction missing');
if(!js.includes('v0.17 적용됨'))throw new Error('Visible build marker missing');
if(!html.includes('app-v17.js')||!html.includes('app-v17.css'))throw new Error('v0.17 loader missing');
console.log('v0.17 hard guard tests passed');
