const fs=require('fs');
const cfg=JSON.parse(fs.readFileSync('comcigan-config.json','utf8'));
if(!cfg.enabled)throw new Error('Comcigan collector config must be enabled');
const wf=fs.readFileSync('.github/workflows/sync-comcigan.yml','utf8');
if(!wf.includes("cron: '*/30 * * * *'"))throw new Error('30-minute Comcigan refresh cron missing');
for(const token of ['teacher-name-multiple','teacher-index-name-mismatch','teacher-not-resolved','teacher-data-missing','FETCH_DETAIL']){
  if(!wf.includes(token))throw new Error('Sanitized Comcigan resolution detail missing: '+token);
}
if(wf.includes('cat /tmp/comcigan-fetch.log')||wf.includes('tee /tmp/comcigan-fetch.log'))throw new Error('Raw Comcigan collector log must not be printed');
const app=fs.readFileSync('app-v14.js','utf8');
if(!app.includes("./live/comcigan.json"))throw new Error('Plain live Comcigan feed missing');
if(!app.includes('lockTimetableReadOnly'))throw new Error('Read-only timetable guard missing');
if(!app.includes("q('#ttAdd')?.remove()"))throw new Error('Manual timetable add control must be removed');
if(!app.includes("q('#ttExceptionAdd')?.remove()"))throw new Error('Manual exception control must be removed');
if(!app.includes("const LOCAL_CFG_KEY='myTeacherOS.comciganConfig'"))throw new Error('Per-browser Comcigan config storage missing');
if(!app.includes('readLocalConfig()||blankConfig()'))throw new Error('New browsers must start with blank Comcigan settings');
if(app.includes("fetch('./comcigan-config.json"))throw new Error('Browser must not inherit shared collector config');
if(!app.includes('if(!completeConfig(config))'))throw new Error('Unconfigured browser must block Comcigan feed application');
if(!app.includes('sameConfig'))throw new Error('Comcigan payload/config mismatch guard missing');
if(!app.includes('개인 설정 필요'))throw new Error('Personal config onboarding copy missing');
if(app.includes("c.teacherName||p?.teacherName"))throw new Error('Shared payload teacher name must not leak into unconfigured UI');
console.log('v0.14 per-browser Comcigan isolation and sanitized collector diagnostics tests passed');
