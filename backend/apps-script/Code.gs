const TOS34 = Object.freeze({
  VERSION: '34.0',
  ALLOWED_ORIGIN: 'https://puzzlex5.github.io',
  STATE_FILE: 'teacher-os-private-state.json',
  ROOT_FOLDER: 'Teacher OS Automation',
  INBOX_FOLDER: 'Teacher OS Inbox',
  CALENDAR_NAME: 'Teacher OS',
  TRIGGER_FN: 'automationScanTrigger',
  DEFAULT_GMAIL_QUERY: 'newer_than:7d (공문 OR 제출 OR 마감 OR 회신 OR 수행평가 OR 지필평가 OR 일정 OR 업무 OR 협조)',
  MAX_ITEMS: 500,
  MAX_AUDIT: 500,
  MAX_APPROVALS: 200,
  MAX_SEEN: 1800
});

function doGet() {
  ensureInstalled_();
  const html = `<!doctype html><html><head><base target="_top"><meta charset="utf-8"></head><body><script>
  (()=>{
    const ORIGIN=${JSON.stringify(TOS34.ALLOWED_ORIGIN)};
    const CHANNEL='teacher-os-google-v34';
    const METHODS=new Set(['apiHealth','apiSyncSnapshot','apiApproveAction','apiRejectAction','apiRepairAutomation','apiRunScanNow','apiSaveConfig']);
    function send(x){parent.postMessage(Object.assign({channel:CHANNEL},x),ORIGIN)}
    window.addEventListener('message',e=>{
      if(e.origin!==ORIGIN||!e.data||e.data.channel!==CHANNEL)return;
      const id=e.data.id,method=e.data.method,args=Array.isArray(e.data.args)?e.data.args:[];
      if(!METHODS.has(method)){send({id,ok:false,error:'허용되지 않은 메서드'});return}
      let runner=google.script.run.withSuccessHandler(result=>send({id,ok:true,result})).withFailureHandler(err=>send({id,ok:false,error:String(err&&err.message||err)}));
      try{runner[method].apply(runner,args)}catch(err){send({id,ok:false,error:String(err&&err.message||err)})}
    });
    send({type:'ready',version:${JSON.stringify(TOS34.VERSION)}});
  })();
  <\/script></body></html>`;
  return HtmlService.createHtmlOutput(html)
    .setTitle('Teacher OS Google Bridge')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function apiHealth() {
  ensureInstalled_();
  const state = loadState_();
  return buildHealth_(state);
}

function apiSyncSnapshot(cursor) {
  ensureInstalled_();
  let state = loadState_();
  const last = Date.parse(state.lastScanAt || '') || 0;
  if (Date.now() - last > 20 * 60 * 1000) {
    try { automationScan_('client-stale-repair'); } catch (e) { /* state records failure */ }
    state = loadState_();
  }
  const n = Number(cursor) || 0;
  const items = (state.items || []).filter(x => Number(x.seq || 0) > n).slice(-250);
  const maxSeq = (state.items || []).reduce((m,x)=>Math.max(m,Number(x.seq||0)),n);
  return {
    version: TOS34.VERSION,
    cursor: maxSeq,
    lastScanAt: state.lastScanAt || '',
    items,
    approvals: (state.approvals || []).filter(x => x.status === 'pending').slice(-100),
    audit: (state.audit || []).slice(-80),
    health: buildHealth_(state),
    config: publicConfig_()
  };
}

function apiRunScanNow() {
  ensureInstalled_();
  automationScan_('client-manual');
  return apiSyncSnapshot(0);
}

function apiRepairAutomation() {
  ensureInstalled_(true);
  const state = loadState_();
  audit_(state,'system','repair','자동화 트리거·전용 폴더·전용 캘린더를 점검/복구했습니다.');
  saveState_(state);
  return buildHealth_(state);
}

function apiSaveConfig(input) {
  ensureInstalled_();
  const p = PropertiesService.getScriptProperties();
  const v = input && typeof input === 'object' ? input : {};
  if (typeof v.gmailQuery === 'string') {
    const q = v.gmailQuery.trim().slice(0,500);
    if (q) p.setProperty('GMAIL_QUERY', q); else p.deleteProperty('GMAIL_QUERY');
  }
  if (typeof v.autoReminders === 'boolean') p.setProperty('AUTO_REMINDERS', v.autoReminders ? 'true' : 'false');
  return publicConfig_();
}

function apiApproveAction(id) {
  ensureInstalled_();
  const state = loadState_();
  const a = (state.approvals || []).find(x => x.id === String(id));
  if (!a) throw new Error('승인 대상을 찾지 못했습니다.');
  if (a.status !== 'pending') return a;
  // v34는 외부 발송·삭제·기존 일정 변경을 실행하지 않습니다.
  // 현재 승인 항목은 충돌 검토를 사용자가 확인했다는 감사 기록만 남깁니다.
  if (!['review_conflict','review_external_action'].includes(a.type)) throw new Error('이 작업 유형은 자동 실행이 허용되지 않습니다.');
  a.status = 'approved'; a.decidedAt = new Date().toISOString();
  audit_(state,'approval','approved',a.title || a.type,{approvalId:a.id});
  saveState_(state);
  return a;
}

function apiRejectAction(id) {
  ensureInstalled_();
  const state = loadState_();
  const a = (state.approvals || []).find(x => x.id === String(id));
  if (!a) throw new Error('승인 대상을 찾지 못했습니다.');
  if (a.status === 'pending') {
    a.status = 'rejected'; a.decidedAt = new Date().toISOString();
    audit_(state,'approval','rejected',a.title || a.type,{approvalId:a.id});
    saveState_(state);
  }
  return a;
}

function automationScanTrigger() { automationScan_('timer'); }

function automationScan_(reason) {
  ensureInstalled_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const state = loadState_();
    const start = Date.now();
    const results = {};
    results.gmail = runSource_(state,'gmail',()=>scanGmail_(state));
    results.drive = runSource_(state,'drive',()=>scanDrive_(state));
    results.calendar = runSource_(state,'calendar',()=>scanCalendar_(state));
    state.lastScanAt = new Date().toISOString();
    state.lastScanReason = String(reason || 'timer');
    state.lastScanDurationMs = Date.now() - start;
    audit_(state,'scan','complete',`자동 스캔 완료 · Gmail ${results.gmail.added||0} · Drive ${results.drive.added||0} · Calendar ${results.calendar.added||0}`,{reason:state.lastScanReason,durationMs:state.lastScanDurationMs});
    trimState_(state);
    saveState_(state);
  } finally { lock.releaseLock(); }
}

function runSource_(state, source, fn) {
  state.failures = state.failures || {};
  const fail = state.failures[source] || {};
  if (fail.nextRetryAt && Date.now() < Date.parse(fail.nextRetryAt)) return {skipped:true,added:0};
  try {
    const result = fn() || {added:0};
    state.failures[source] = {count:0,lastSuccessAt:new Date().toISOString(),lastError:'',nextRetryAt:''};
    return result;
  } catch (e) {
    const count = Number(fail.count || 0) + 1;
    const delay = Math.min(6*60*60*1000, 5*60*1000 * Math.pow(2, Math.min(count-1,6)));
    state.failures[source] = {count,lastFailureAt:new Date().toISOString(),lastError:String(e && e.message || e).slice(0,500),nextRetryAt:new Date(Date.now()+delay).toISOString()};
    audit_(state,source,'failure',`자동 수집 실패 · ${String(e && e.message || e).slice(0,220)}`,{retryMinutes:Math.round(delay/60000),count});
    return {failed:true,added:0};
  }
}

function scanGmail_(state) {
  const query = PropertiesService.getScriptProperties().getProperty('GMAIL_QUERY') || TOS34.DEFAULT_GMAIL_QUERY;
  const threads = GmailApp.search(query,0,40);
  let added = 0;
  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const externalId = message.getId();
      if (seen_(state,'gmail',externalId)) continue;
      const subject = message.getSubject() || 'Gmail';
      const body = (message.getPlainBody() || '').slice(0,12000);
      const item = analyzeText_('gmail',externalId,subject,body,{timestamp:message.getDate().toISOString()});
      markSeen_(state,'gmail',externalId);
      if (!item) continue;
      addItem_(state,item); added++;
      maybeCreateSafeReminder_(state,item);
      maybeQueueConflict_(state,item);
    }
  }
  audit_(state,'gmail','success',`Gmail 자동 감지 ${added}건`,{query});
  return {added};
}

function scanDrive_(state) {
  const folder = getInboxFolder_();
  const files = folder.getFiles();
  let added = 0, checked = 0;
  while (files.hasNext() && checked < 120) {
    checked++;
    const file = files.next();
    const externalId = file.getId() + ':' + file.getLastUpdated().getTime();
    if (seen_(state,'drive',externalId)) continue;
    let text = '';
    const mt = file.getMimeType();
    try {
      if (mt === MimeType.GOOGLE_DOCS) text = DocumentApp.openById(file.getId()).getBody().getText().slice(0,18000);
      else if (/^text\//.test(mt)) text = file.getBlob().getDataAsString('UTF-8').slice(0,18000);
    } catch (e) { text = ''; }
    const title = file.getName() || 'Drive 자료';
    const authoritative = /평가계획|수행평가계획|지필평가계획/i.test(title);
    const item = analyzeText_('drive',externalId,title,text || title,{timestamp:file.getLastUpdated().toISOString(),mimeType:mt,authoritative,fileId:file.getId()});
    markSeen_(state,'drive',externalId);
    if (!item) continue;
    addItem_(state,item); added++;
    maybeCreateSafeReminder_(state,item);
    maybeQueueConflict_(state,item);
  }
  audit_(state,'drive','success',`Drive Inbox 자동 감지 ${added}건`,{checked,folderId:folder.getId()});
  return {added};
}

function scanCalendar_(state) {
  const cal = CalendarApp.getDefaultCalendar();
  const from = new Date(Date.now()-24*60*60*1000), to = new Date(Date.now()+60*24*60*60*1000);
  const events = cal.getEvents(from,to);
  let added = 0;
  for (const ev of events.slice(0,300)) {
    const externalId = String(ev.getId()) + ':' + ev.getStartTime().getTime();
    if (seen_(state,'calendar',externalId)) continue;
    const date = formatDate_(ev.getStartTime());
    const item = {
      id:'calendar:'+shortHash_(externalId),seq:nextSeq_(state),source:'calendar',externalId,
      title:redact_(ev.getTitle() || 'Google Calendar 일정'),summary:'Google Calendar에서 읽은 일정',date,
      category:'calendar',confidence:0.99,authoritative:true,timestamp:ev.getStartTime().toISOString(),createdAt:new Date().toISOString()
    };
    markSeen_(state,'calendar',externalId); addItem_(state,item); added++;
  }
  audit_(state,'calendar','success',`Google Calendar 자동 미러링 ${added}건`,{rangeDays:60});
  return {added};
}

function analyzeText_(source, externalId, title, raw, meta) {
  const text = String(raw || '').replace(/\r/g,'\n').replace(/[ \t]+/g,' ').slice(0,20000);
  const category = classify_(title + '\n' + text);
  if (!category) return null;
  const date = extractDate_(text + '\n' + title);
  const focus = focusSentence_(text,title);
  const strong = /제출|마감|까지|수행평가|지필평가|평가계획|회의|행사|휴업|방학|고사|공문|회신/i.test(text + title);
  let confidence = 0.54 + (date ? 0.22 : 0) + (category ? 0.12 : 0) + (strong ? 0.08 : 0) + (source === 'drive' ? 0.03 : 0);
  confidence = Math.min(0.99,Math.round(confidence*100)/100);
  return {
    id:source+':'+shortHash_(externalId),seq:0,source,externalId:String(externalId),
    title:redact_(String(title||'자동 감지').slice(0,220)),summary:redact_(focus).slice(0,300),date,
    category,confidence,authoritative:!!(meta && meta.authoritative),timestamp:(meta&&meta.timestamp)||new Date().toISOString(),
    target:extractTarget_(text),weight:extractWeight_(text),sourceDetail:source==='drive'?'Teacher OS Inbox':'Gmail 자동 감지',
    createdAt:new Date().toISOString()
  };
}

function classify_(text) {
  const s = String(text || '');
  if (/수행평가|지필평가|평가계획|평가일|평가 일정/i.test(s)) return 'assessment';
  if (/제출|마감|공문|회신|업무|신청|보고|결재|협조/i.test(s)) return 'admin';
  if (/행사|회의|연수|축제|체험학습|방학|휴업|고사|시험|일정/i.test(s)) return 'calendar';
  return '';
}

function extractDate_(text) {
  const s = String(text || '');
  const now = new Date();
  let m;
  m = s.match(/(20\d{2})[.\-/년\s]+(1[0-2]|0?[1-9])[.\-/월\s]+(3[01]|[12]\d|0?[1-9])\s*일?/);
  if (m) return validDate_(Number(m[1]),Number(m[2]),Number(m[3]));
  m = s.match(/(?:^|\D)(1[0-2]|0?[1-9])\s*월\s*(3[01]|[12]\d|0?[1-9])\s*일/);
  if (m) {
    let y = now.getFullYear(), mo=Number(m[1]), d=Number(m[2]);
    const candidate = new Date(y,mo-1,d);
    if (candidate.getTime() < now.getTime()-90*24*60*60*1000) y++;
    return validDate_(y,mo,d);
  }
  if (/\b내일\b/.test(s)) return formatDate_(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1));
  if (/\b모레\b/.test(s)) return formatDate_(new Date(now.getFullYear(),now.getMonth(),now.getDate()+2));
  if (/\b오늘\b/.test(s)) return formatDate_(now);
  return '';
}

function validDate_(y,m,d) {
  const x = new Date(y,m-1,d);
  if (x.getFullYear()!==y||x.getMonth()!==m-1||x.getDate()!==d) return '';
  return formatDate_(x);
}
function formatDate_(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function extractTarget_(s) { const m=String(s||'').match(/([1-6])\s*학년(?:\s*([1-9]\d?)\s*반)?/); return m ? `${m[1]}학년${m[2]?` ${m[2]}반`:''}` : ''; }
function extractWeight_(s) { const m=String(s||'').match(/(\d{1,3})\s*%/); return m ? `${m[1]}%` : ''; }
function focusSentence_(text,title) {
  const lines=String(text||'').split(/[\n.!?]+/).map(x=>x.trim()).filter(Boolean);
  const hit=lines.find(x=>/20\d{2}|\d{1,2}\s*월\s*\d{1,2}\s*일|제출|마감|평가|회의|행사|회신|업무/.test(x));
  return (hit||title||lines[0]||'').slice(0,360);
}
function redact_(value) {
  return String(value||'')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[이메일]')
    .replace(/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/g,'[전화번호]')
    .replace(/\b\d{2,3}[-\s]\d{3,4}[-\s]\d{4}\b/g,'[전화번호]');
}

function maybeCreateSafeReminder_(state,item) {
  if ((PropertiesService.getScriptProperties().getProperty('AUTO_REMINDERS') || 'true') !== 'true') return;
  if (!item.date || !['admin','assessment'].includes(item.category) || Number(item.confidence||0) < 0.82) return;
  const cal = getAutomationCalendar_();
  const [y,m,d] = item.date.split('-').map(Number), day=new Date(y,m-1,d);
  const marker=`TeacherOS:${item.source}:${item.externalId}`;
  const exists=cal.getEventsForDay(day).some(e=>String(e.getDescription()||'').includes(marker));
  if (exists) return;
  const ev=cal.createAllDayEvent(`[Teacher OS] ${item.title}`,day,{description:`${marker}\n자동 감지 출처: ${item.source}\n신뢰도: ${item.confidence}\n${item.summary||''}`});
  audit_(state,'calendar','auto-safe',`전용 Calendar에 안전 알림 생성 · ${item.title}`,{eventId:ev.getId(),date:item.date,source:item.source});
}

function maybeQueueConflict_(state,item) {
  if (item.category!=='assessment'||!item.date) return;
  const [y,m,d]=item.date.split('-').map(Number), day=new Date(y,m-1,d);
  const conflict=CalendarApp.getDefaultCalendar().getEventsForDay(day).find(e=>/휴업|방학|공휴|재량휴업|체험학습|고사|시험/i.test(e.getTitle()||''));
  if (!conflict) return;
  state.approvals=state.approvals||[];
  const id='conflict:'+shortHash_(item.externalId+'|'+conflict.getId()+'|'+item.date);
  if (state.approvals.some(x=>x.id===id)) return;
  state.approvals.push({id,type:'review_conflict',status:'pending',requiresApproval:true,title:`평가 일정 충돌 확인 · ${item.title}`,reason:`${item.date}에 Google Calendar의 '${redact_(conflict.getTitle())}' 일정과 겹칩니다.`,createdAt:new Date().toISOString(),itemId:item.id});
  audit_(state,'approval','queued',`사용자 승인 필요 · ${item.title}`,{approvalId:id});
}

function ensureInstalled_(force) {
  const p=PropertiesService.getScriptProperties();
  getRootFolder_(); getInboxFolder_(); getAutomationCalendar_();
  const triggers=ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===TOS34.TRIGGER_FN);
  if (force || triggers.length===0) {
    triggers.forEach(t=>ScriptApp.deleteTrigger(t));
    ScriptApp.newTrigger(TOS34.TRIGGER_FN).timeBased().everyMinutes(15).create();
  } else if (triggers.length>1) {
    triggers.slice(1).forEach(t=>ScriptApp.deleteTrigger(t));
  }
  if (!p.getProperty('AUTO_REMINDERS')) p.setProperty('AUTO_REMINDERS','true');
  if (!p.getProperty('GMAIL_QUERY')) p.setProperty('GMAIL_QUERY',TOS34.DEFAULT_GMAIL_QUERY);
  loadState_();
}

function getRootFolder_() {
  const p=PropertiesService.getScriptProperties();let id=p.getProperty('ROOT_FOLDER_ID');
  try { if(id) return DriveApp.getFolderById(id); } catch(e) {}
  const it=DriveApp.getFoldersByName(TOS34.ROOT_FOLDER);const f=it.hasNext()?it.next():DriveApp.createFolder(TOS34.ROOT_FOLDER);p.setProperty('ROOT_FOLDER_ID',f.getId());return f;
}
function getInboxFolder_() {
  const p=PropertiesService.getScriptProperties();let id=p.getProperty('INBOX_FOLDER_ID');
  try { if(id) return DriveApp.getFolderById(id); } catch(e) {}
  const root=getRootFolder_(),it=root.getFoldersByName(TOS34.INBOX_FOLDER);const f=it.hasNext()?it.next():root.createFolder(TOS34.INBOX_FOLDER);p.setProperty('INBOX_FOLDER_ID',f.getId());return f;
}
function getAutomationCalendar_() {
  const p=PropertiesService.getScriptProperties();let id=p.getProperty('CALENDAR_ID');
  try { if(id) return CalendarApp.getCalendarById(id); } catch(e) {}
  const found=CalendarApp.getCalendarsByName(TOS34.CALENDAR_NAME);const cal=found.length?found[0]:CalendarApp.createCalendar(TOS34.CALENDAR_NAME,{summary:'Teacher OS가 안전한 자동 알림만 생성하는 전용 캘린더'});p.setProperty('CALENDAR_ID',cal.getId());return cal;
}

function blankState_(){return{version:1,seq:0,lastScanAt:'',lastScanReason:'',items:[],approvals:[],audit:[],seen:{gmail:{},drive:{},calendar:{}},failures:{}}}
function stateFile_(){
  const p=PropertiesService.getScriptProperties();let id=p.getProperty('STATE_FILE_ID');
  try { if(id) return DriveApp.getFileById(id); } catch(e) {}
  const f=getRootFolder_().createFile(TOS34.STATE_FILE,JSON.stringify(blankState_(),null,2),MimeType.PLAIN_TEXT);p.setProperty('STATE_FILE_ID',f.getId());return f;
}
function loadState_(){
  try { const x=JSON.parse(stateFile_().getBlob().getDataAsString('UTF-8'));return x&&typeof x==='object'?Object.assign(blankState_(),x):blankState_(); }
  catch(e){ const s=blankState_();saveState_(s);return s; }
}
function saveState_(state){trimState_(state);stateFile_().setContent(JSON.stringify(state,null,2));}
function trimState_(s){
  s.items=(s.items||[]).slice(-TOS34.MAX_ITEMS);s.audit=(s.audit||[]).slice(-TOS34.MAX_AUDIT);s.approvals=(s.approvals||[]).slice(-TOS34.MAX_APPROVALS);
  s.seen=s.seen||{};['gmail','drive','calendar'].forEach(src=>{const obj=s.seen[src]||{},keys=Object.keys(obj).sort((a,b)=>Number(obj[a]||0)-Number(obj[b]||0));if(keys.length>TOS34.MAX_SEEN)keys.slice(0,keys.length-TOS34.MAX_SEEN).forEach(k=>delete obj[k]);s.seen[src]=obj});
}
function nextSeq_(state){state.seq=Number(state.seq||0)+1;return state.seq}
function addItem_(state,item){item.seq=nextSeq_(state);state.items=state.items||[];state.items.push(item)}
function seen_(state,src,id){return !!(state.seen&&state.seen[src]&&state.seen[src][String(id)]) }
function markSeen_(state,src,id){state.seen=state.seen||{};state.seen[src]=state.seen[src]||{};state.seen[src][String(id)]=Date.now()}
function audit_(state,source,event,message,extra){state.audit=state.audit||[];state.audit.push({at:new Date().toISOString(),source,event,message:String(message||'').slice(0,500),extra:extra||{}})}
function shortHash_(value){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value||''),Utilities.Charset.UTF_8);return bytes.slice(0,8).map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('')}

function triggerHealthy_(){return ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===TOS34.TRIGGER_FN).length===1}
function buildHealth_(state){
  const age=state.lastScanAt?Date.now()-Date.parse(state.lastScanAt):Infinity;
  const failures=state.failures||{},bad=Object.keys(failures).filter(k=>Number(failures[k].count||0)>=3);
  return{ok:triggerHealthy_()&&age<=45*60*1000&&bad.length===0,trigger:triggerHealthy_(),lastScanAt:state.lastScanAt||'',ageMinutes:Number.isFinite(age)?Math.round(age/60000):null,lastScanDurationMs:Number(state.lastScanDurationMs||0),repeatedFailures:bad,version:TOS34.VERSION};
}
function publicConfig_(){
  const p=PropertiesService.getScriptProperties();
  return{gmailQuery:p.getProperty('GMAIL_QUERY')||TOS34.DEFAULT_GMAIL_QUERY,autoReminders:(p.getProperty('AUTO_REMINDERS')||'true')==='true',inboxFolderId:p.getProperty('INBOX_FOLDER_ID')||'',calendarId:p.getProperty('CALENDAR_ID')||'',scanEveryMinutes:15};
}
