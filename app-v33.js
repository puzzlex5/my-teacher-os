(function(){
  const A=globalThis.TeacherOSAgentCore33;if(!A)return;
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const SETTINGS_KEY='myTeacherOS.agent33.settings.v1',STATE_KEY='myTeacherOS.agent33.state.v1';
  let busy=false,lastActions=[];

  function settings(){try{return Object.assign({auto:true,maxAutoTasks:4},JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'))}catch{return{auto:true,maxAutoTasks:4}}}
  function writeSettings(v){localStorage.setItem(SETTINGS_KEY,JSON.stringify(v))}
  function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch{return{}}}
  function writeState(v){try{localStorage.setItem(STATE_KEY,JSON.stringify(v))}catch{}}
  function currentYear(){try{return typeof cur==='function'?cur():null}catch{return null}}
  function policyPending33(y){try{return typeof policyInfo==='function'?!!policyInfo(y)?.pending:false}catch{return false}}
  function backupAge33(y){if(!y?.lastBackupAt)return 999;const n=Math.floor((Date.now()-new Date(y.lastBackupAt).getTime())/86400000);return Number.isFinite(n)?Math.max(0,n):999}
  function uid33(){return crypto.randomUUID?crypto.randomUUID():'a33-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
  function scan33(){const y=currentYear();if(!y)return[];return A.buildActions(y,{now:new Date(),policyPending:policyPending33(y),backupAgeDays:backupAge33(y),isNoClassEvent:e=>{try{return C?.isNoClassEvent?C.isNoClassEvent(e):false}catch{return false}}})}
  function safeSave33(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){console.error('Teacher OS agent save',e);return false}}

  function ensureUI33(){
    const body=q('#dashboardBody');if(!body||q('#workAgent33'))return;
    const banner=q('#policyBanner');const html=`<article id="workAgent33" class="card work-agent33 spaced"><div class="agent33-head"><div><span class="kicker">AGENT MODE · SAFE AUTO</span><h2>교사 업무 에이전트</h2><p class="muted">일정·평가·행정·정책·백업을 함께 보고, 위험한 변경은 하지 않고 안전한 확인 업무만 자동으로 할 일에 등록합니다.</p></div><div class="agent33-controls"><button class="btn secondary tiny" id="agentAuto33" type="button"></button><button class="btn primary tiny" id="agentRun33" type="button">지금 점검</button></div></div><div id="agentSummary33" class="agent33-summary"></div><div id="agentList33" class="agent33-list"></div><div class="mini agent33-foot" id="agentFoot33"></div></article>`;
    if(banner)banner.insertAdjacentHTML('afterend',html);else body.insertAdjacentHTML('afterbegin',html);
    q('#agentRun33')?.addEventListener('click',()=>run33(true));
    q('#agentAuto33')?.addEventListener('click',()=>{const s=settings();s.auto=!s.auto;writeSettings(s);run33(true)});
    q('#agentList33')?.addEventListener('click',e=>{const b=e.target.closest('[data-agent-view]');if(b&&typeof switchView==='function')switchView(b.dataset.agentView)});
    const legacy=q('#agentRun');if(legacy)legacy.onclick=()=>run33(true);
  }
  function autoTasks33(actions,manual=false){
    const y=currentYear(),s=settings();if(!y||!s.auto||busy)return 0;
    y.tasks=Array.isArray(y.tasks)?y.tasks:[];
    const fingerprint=actions.map(a=>a.id).sort().join('|'),st=readState();
    if(!manual&&fingerprint&&st.lastAutoFingerprint===fingerprint)return 0;
    const candidates=A.safeTaskCandidates(actions,y.tasks).slice(0,Math.max(0,Number(s.maxAutoTasks)||4));
    if(!candidates.length){if(fingerprint)writeState({...st,lastAutoFingerprint:fingerprint});return 0}
    busy=true;
    try{
      candidates.forEach(t=>y.tasks.push({...t,id:uid33()}));
      safeSave33();
      writeState({...readState(),lastAutoFingerprint:fingerprint,lastAutoAt:new Date().toISOString()});
      return candidates.length;
    }finally{busy=false}
  }
  function badge33(a){return a.severity==='critical'?'긴급':a.severity==='warning'?'확인':'정보'}
  function render33(actions,created=0,manual=false){
    ensureUI33();const box=q('#agentList33'),sum=q('#agentSummary33'),foot=q('#agentFoot33'),toggle=q('#agentAuto33');if(!box||!sum)return;
    const s=A.summary(actions),cfg=settings();if(toggle){toggle.textContent=`안전 자동화 ${cfg.auto?'켜짐':'꺼짐'}`;toggle.setAttribute('aria-pressed',cfg.auto?'true':'false')}
    sum.innerHTML=`<div><b>${s.critical}</b><span>긴급</span></div><div><b>${s.warning}</b><span>확인</span></div><div><b>${s.total}</b><span>전체 감지</span></div><div><b>${created}</b><span>이번 실행 자동등록</span></div>`;
    box.innerHTML=actions.length?actions.slice(0,8).map(a=>`<div class="agent33-row ${esc(a.severity)}"><div class="agent33-main"><div class="agent33-title"><span class="agent33-badge ${esc(a.severity)}">${badge33(a)}</span><b>${esc(a.title)}</b></div><div class="mini">${esc(a.why)}</div><div class="agent33-next">다음 행동 · ${esc(a.nextAction)}</div></div><button type="button" class="btn secondary tiny" data-agent-view="${esc(a.targetView||'dashboard')}">열기</button></div>`).join(''):`<div class="agent33-clear"><b>지금 등록된 자료에서는 즉시 처리할 위험을 찾지 못했습니다.</b><span>자료가 바뀌면 다시 자동 점검합니다.</span></div>`;
    const st=readState(),when=new Date(st.lastRunAt||Date.now()).toLocaleString('ko-KR');if(foot)foot.textContent=`마지막 점검 ${when}${cfg.auto?' · 안전 자동화 켜짐':''}${manual?' · 수동 점검':''}`;
    const legacy=q('#agentResult');if(legacy)legacy.innerHTML=actions.length?actions.slice(0,6).map(a=>`• ${esc(a.title)} — ${esc(a.nextAction)}`).join('<br>'):'현재 등록 데이터에서는 특별한 경고를 찾지 못했습니다.';
  }
  function run33(manual=false){
    if(busy)return;ensureUI33();const actions=scan33();lastActions=actions;const created=autoTasks33(actions,manual);writeState({...readState(),lastRunAt:new Date().toISOString(),lastCount:actions.length,lastCritical:A.summary(actions).critical,lastAutoCreated:created});render33(actions,created,manual);
    if(created&&typeof globalThis.render==='function'){busy=true;try{globalThis.render()}finally{busy=false}setTimeout(()=>render33(scan33(),created,manual),0)}
  }
  function refresh33(){ensureUI33();if(!currentYear()){render33([],0,false);return}run33(false);const foot=q('.side-foot');if(foot)foot.textContent='v0.33 · proactive safe agent'}

  globalThis.TeacherOSAgent33={scan:scan33,run:run33,settings};
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);if(!busy)setTimeout(()=>run33(false),0);return r};
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='dashboard')setTimeout(()=>render33(lastActions.length?lastActions:scan33(),0,false),0);return r};
  setTimeout(refresh33,0);
})();
