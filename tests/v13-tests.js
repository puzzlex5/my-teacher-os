const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
const html=read('app-v13.html');
const js=read('app-v13.js');
const css=read('app-v13.css');
const checks=[
  [html.includes('app-v13.css'),'v13 css is loaded'],
  [html.includes('app-v13.js'),'v13 js is loaded'],
  [js.includes('teacherGlobalSearch'),'global search exists'],
  [js.includes('teacherInboxList'),'unified inbox exists'],
  [js.includes('teacherRecentList'),'recent activity exists'],
  [js.includes("e.key.toLowerCase()==='k'"),'Ctrl/Cmd+K shortcut exists'],
  [css.includes('--naver:#03c75a'),'Naver-inspired green token exists'],
  [css.includes('#globalSearchDialog'),'search dialog styling exists'],
  [css.includes('.teacher-work-grid'),'work grid styling exists']
];
for(const [ok,name] of checks){if(!ok)throw new Error('FAIL: '+name);console.log('PASS:',name)}
console.log('v0.13 tests passed:',checks.length);
