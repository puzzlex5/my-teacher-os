const fs=require('fs');
const js=fs.readFileSync('app-v15.js','utf8');
const css=fs.readFileSync('app-v15.css','utf8');
const html=fs.readFileSync('app-v15.html','utf8');
for(const token of ['#ttAdd','#ttExceptionAdd','#ttDlg','#ttExceptionDlg','#ttExceptionList']){
  if(!js.includes(token))throw new Error(`v0.15 must remove ${token}`);
}
if(!js.includes("stopImmediatePropagation"))throw new Error('Timetable click interception missing');
if(!js.includes('MutationObserver'))throw new Error('Legacy UI re-render guard missing');
if(!css.includes('.cell-add'))throw new Error('Legacy plus affordance CSS guard missing');
if(!html.includes('app-v15.js')||!html.includes('app-v15.css'))throw new Error('v0.15 loader missing');
console.log('v0.15 timetable auto-only tests passed');
