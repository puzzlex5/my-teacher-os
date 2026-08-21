const fs=require('fs');
const html=fs.readFileSync('app-v12.html','utf8');
const css=fs.readFileSync('app-v12.css','utf8');
const js=fs.readFileSync('app-v12.js','utf8');
function ok(cond,msg){if(!cond)throw new Error(msg)}
ok(html.includes('app-v12.css'),'v12 css not loaded');
ok(html.includes('app-v12.js'),'v12 js not loaded');
ok(js.includes('이번 주 수업 흐름'),'week visualization missing');
ok(js.includes('반별 진도 지도'),'progress visualization missing');
ok(js.includes('평가까지 남은 수업'),'assessment visualization missing');
ok(css.includes('.visual-command'),'visual command styles missing');
ok(css.includes('@media(max-width:760px)'),'mobile visualization styles missing');
console.log('v0.12 visualization tests passed');
