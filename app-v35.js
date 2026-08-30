(function(){
  const N=globalThis.TeacherOSNeisCore35;if(!N)return;
  const q=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const SETTINGS_KEY='myTeacherOS.neis35.settings.v1',AUDIT_KEY='myTeacherOS.neis35.audit.v1';
  let busy=false,timer=null,lastResult=null;

  function settings(){try{return Object.assign({apiKey:'',autoSync:true,intervalHours:6},JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'))}catch{return{apiKey:'',autoSync:true,intervalHours:6}}}
  function writeSettings(v){localStorage.setItem(SETTINGS_KEY,JSON.stringify(v))}
  function currentYear(){try{return typeof cur==='function'?cur():null}catch{return null}}
  function saveState(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){console.error('NEIS v35 save',e);return false}}
  function ensureYear(y){if(!y)return null;y.neis35=y.neis35&&typeof y.neis35==='object'?y.neis35:{};return y.neis35}
  function uid(){return crypto.randomUUID?crypto.randomUUID():'n35-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
  function audit(event,message,extra){let a=[];try{a=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]');if(!Array.isArray(a))a=[]}catch{}a.push({at:new Date().toISOString(),event,message,extra:extra||{}});a=a.slice(-180);try{localStorage.setItem(AUDIT_KEY,JSON.stringify(a))}catch{}return a}
  function audits(){try{const a=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
  function maskKey(v){const s=String(v||'');return s?`${s.slice(0,3)}••••${s.slice(-3)}`:'미설정'}
  function setStatus(text,kind='pending'){const el=q('#neisStatus35');if(el){el.textContent=text;el.className='neis35-status '+kind}}

  function ensureUI(){
    const dash=q('#dashboardBody');
    if(dash&&!q('#neisOfficial35')){
      const anchor=q('#googleAutopilot34')||q('#workAgent33')||q('#policyBanner');
      const html=`<article id="neisOfficial35" class="card neis35 spaced"><div class="neis35-head"><div><span class="kicker">NEIS OFFICIAL · v0.35</span><h2>나이스 공식 데이터 자동연결</h2><p class="muted">학교정보·학사일정을 공식 Open API로 자동 동기화하고, 내 시간표에 학급 정보가 있으면 공식 학급시간표와 자동 교차검증합니다.</p></div><div class="neis35-actions"><span id="neisStatus35" class="neis35-status pending">점검 중</span><button class="btn secondary tiny" id="neisSync35" type="button">지금 확인</button></div></div><div id="neisSummary35" class="neis35-summary"></div><div id="neisAlerts35" class="neis35-alerts"></div><div id="neisAudit35" class="neis35-audit"></div></article>`;
      if(anchor)anchor.insertAdjacentHTML('afterend',html);else dash.insertAdjacentHTML('afterbegin',html);
      q('#neisSync35')?.addEventListener('click',()=>syncNow(true));
    }
    const settingsView=q('#settings');
    if(settingsView&&!q('#neisSettings35')){
      const panel=`<article id="neisSettings35" class="card neis35-settings spaced"><div class="head"><div><span class="kicker">NEIS OFFICIAL OPEN API</span><h3>나이스 공식 연결</h3><p class="muted">인증키는 이 브라우저에만 저장하며 GitHub나 Teacher OS 서버로 보내지 않습니다. 한 번 저장하면 이후 자동 동기화됩니다.</p></div></div><label class="neis35-label">Open API 인증키<input id="neisKey35" class="field" type="password" autocomplete="off" placeholder="나이스 교육정보 개방포털에서 발급한 인증키"></label><div class="neis35-toggle"><label><input type="checkbox" id="neisAuto35"> 자동 동기화 사용</label><span id="neisKeyState35" class="mini"></span></div><div class="quick"><button class="btn primary" id="neisSave35" type="button">인증키 저장</button><a class="btn secondary" href="https://open.neis.go.kr/portal/guide/apiGuidePage.do" target="_blank" rel="noopener">공식 발급 안내</a><button class="btn secondary" id="neisForget35" type="button">인증키 삭제</button></div><div class="notice spaced"><b>자동 범위:</b> 현재 연도의 학교명으로 학교코드를 자동 찾고, 공식 학사일정을 Teacher OS 일정에 반영합니다. NEIS 내부 성적·학생부·출결 데이터에는 접근하지 않습니다.</div></article>`;
      const anchor=q('#googleSettings34')||settingsView.querySelector('.health-grid')||settingsView.querySelector('.section-intro');
      if(anchor)anchor.insertAdjacentHTML('afterend',panel);else settingsView.insertAdjacentHTML('afterbegin',panel);
      q('#neisSave35')?.addEventListener('click',()=>{const s=settings(),v=String(q('#neisKey35')?.value||'').trim();if(!v){setStatus('인증키를 입력하세요','warn');return}s.apiKey=v;s.autoSync=!!q('#neisAuto35')?.checked;writeSettings(s);q('#neisKey35').value='';audit('config','NEIS Open API 인증키를 이 브라우저에 저장했습니다.');renderSettings();schedule();syncNow(true)});
      q('#neisAuto35')?.addEventListener('change',e=>{const s=settings();s.autoSync=!!e.target.checked;writeSettings(s);schedule();renderSettings()});
      q('#neisForget35')?.addEventListener('click',()=>{const s=settings();s.apiKey='';writeSettings(s);audit('config','NEIS Open API 인증키를 이 브라우저에서 삭제했습니다.');renderSettings();renderResult(lastResult);setStatus('NEIS 인증키 필요','warn')});
    }
    renderSettings();
  }

  function renderSettings(){const s=settings(),a=q('#neisAuto35'),k=q('#neisKeyState35');if(a)a.checked=!!s.autoSync;if(k)k.textContent=`인증키 ${maskKey(s.apiKey)} · ${s.intervalHours}시간 간격`;}

  async function fetchPage(service,params,index=1,size=500){
    const s=settings();if(!s.apiKey)throw new Error('NEIS Open API 인증키가 필요합니다.');
    const url=N.buildUrl(service,{...params,pIndex:index,pSize:size},s.apiKey);
    let lastErr;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const r=await fetch(url,{cache:'no-store',referrerPolicy:'no-referrer'});if(!r.ok)throw new Error(`HTTP ${r.status}`);
        const json=await r.json(),parsed=N.parseRows(json,service);
        if(parsed.code&&parsed.code!=='INFO-000'&&parsed.code!=='INFO-200')throw new Error(parsed.message||parsed.code);
        return parsed;
      }catch(e){lastErr=e;if(attempt<2)await new Promise(res=>setTimeout(res,1000*Math.pow(2,attempt)))}
    }
    throw lastErr||new Error('NEIS Open API 호출 실패');
  }

  async function fetchAll(service,params,size=500,maxPages=8){
    const first=await fetchPage(service,params,1,size),rows=[...first.rows];
    const pages=Math.min(maxPages,Math.max(1,Math.ceil((first.total||rows.length)/size)));
    for(let i=2;i<=pages;i++){const p=await fetchPage(service,params,i,size);rows.push(...p.rows)}
    return{rows,total:first.total||rows.length};
  }

  async function resolveSchool(y){
    const meta=ensureYear(y),cached=meta.school;
    if(cached&&cached.schoolInputName===String(y.schoolName||'')&&cached.officeInputName===String(y.educationOffice||'')&&cached.schoolCode)return cached;
    const name=String(y.schoolName||'').trim();if(!name)throw new Error('현재 학년도 학교명이 없습니다. 학년도 설정에서 학교명을 먼저 저장하세요.');
    const res=await fetchAll('schoolInfo',{SCHUL_NM:name},100,3);
    const school=N.chooseSchool(res.rows,name,y.educationOffice,y.schoolLevel);
    if(!school)throw new Error(`공식 NEIS에서 '${name}' 학교를 정확히 확인하지 못했습니다.`);
    meta.school={...school,schoolInputName:name,officeInputName:String(y.educationOffice||''),resolvedAt:new Date().toISOString()};
    return meta.school;
  }

  async function syncSchedule(y,school){
    const range=N.schoolYearRange(y.year);
    const res=await fetchAll('SchoolSchedule',{ATPT_OFCDC_SC_CODE:school.officeCode,SD_SCHUL_CODE:school.schoolCode,AY:String(y.year),AA_FROM_YMD:range.from,AA_TO_YMD:range.to},1000,4);
    const merged=N.reconcileSchedule(y.calendarEvents,res.rows);y.calendarEvents=merged.events;
    return{officialCount:merged.officialCount,replacedCount:merged.replacedCount,total:res.total};
  }

  async function mapLimit(list,limit,fn){const out=[];let next=0;async function worker(){while(next<list.length){const i=next++;try{out[i]=await fn(list[i],i)}catch(e){out[i]={error:String(e?.message||e)}}}}await Promise.all(Array.from({length:Math.min(limit,list.length)},worker));return out}
  async function syncClassTimetable(y,school){
    const refs=N.extractClassRefs(y),service=N.timetableService(y.schoolLevel);if(!refs.length)return{refs:[],rows:[],anomalies:[],failed:0};
    const w=N.timetableWindow(new Date());
    const results=await mapLimit(refs,4,async ref=>{
      const res=await fetchAll(service,{ATPT_OFCDC_SC_CODE:school.officeCode,SD_SCHUL_CODE:school.schoolCode,AY:String(y.year),SEM:w.semester,GRADE:ref.grade,CLASS_NM:ref.className,TI_FROM_YMD:w.from,TI_TO_YMD:w.to},500,3);
      return{ref,rows:res.rows};
    });
    const rows=[],failures=[];results.forEach((r,i)=>{if(r?.error)failures.push({ref:refs[i],error:r.error});else rows.push(...(r?.rows||[]))});
    const subjects=(Array.isArray(y.subjects)&&y.subjects.length?y.subjects:[state?.profile?.major]).filter(Boolean);
    const anomalies=N.compareTeacherTimetable(y,rows,subjects),candidates=N.taskCandidates(anomalies,y.tasks);
    y.tasks=Array.isArray(y.tasks)?y.tasks:[];candidates.slice(0,8).forEach(t=>y.tasks.push({...t,id:uid()}));
    return{refs,rows:rows.map(N.compactTimetableRow).slice(-2500),anomalies,failed:failures.length,createdTasks:candidates.slice(0,8).length};
  }

  async function syncNow(manual=false){
    ensureUI();if(busy)return;const y=currentYear(),s=settings();
    if(!y){setStatus('학년도 설정 필요','warn');renderResult(null);return}
    if(!s.apiKey){setStatus('NEIS 인증키 필요','warn');renderResult(null);return}
    busy=true;const btn=q('#neisSync35');if(btn)btn.disabled=true;setStatus('NEIS 공식 데이터 동기화 중…','pending');
    try{
      const meta=ensureYear(y),school=await resolveSchool(y),schedule=await syncSchedule(y,school),tt=await syncClassTimetable(y,school);
      meta.lastSyncAt=new Date().toISOString();meta.lastSuccessAt=meta.lastSyncAt;meta.lastError='';meta.scheduleCount=schedule.officialCount;meta.classRefs=tt.refs;meta.classTimetable=tt.rows;meta.anomalies=tt.anomalies;meta.lastTimetableFailures=tt.failed;
      saveState();lastResult={school,schedule,timetable:tt,at:meta.lastSyncAt};audit('sync',`NEIS 공식 자동동기화 완료 · 학사 ${schedule.officialCount}건 · 학급 ${tt.refs.length}개 검증`,{schedule:schedule.officialCount,classRefs:tt.refs.length,anomalies:tt.anomalies.length,failed:tt.failed});
      if(typeof globalThis.render==='function')try{globalThis.render()}catch{}
      if(typeof globalThis.TeacherOSAgent33?.run==='function')setTimeout(()=>globalThis.TeacherOSAgent33.run(false),0);
      renderResult(lastResult);setStatus(tt.failed?'일부 학급 재시도 예정':'NEIS 공식 연결 정상',tt.failed?'warn':'ok');
      if(manual&&tt.anomalies.length)q('#neisAlerts35')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(e){
      const msg=String(e?.message||e);const meta=ensureYear(y);meta.lastError=msg;meta.lastFailureAt=new Date().toISOString();saveState();audit('failure','NEIS 공식 자동동기화 실패',{error:msg});lastResult=null;renderResult(null);setStatus('NEIS 연결 실패 · 자동 재시도','fail');
    }finally{busy=false;if(btn)btn.disabled=false;schedule()}
  }

  function renderResult(result){
    ensureUI();const y=currentYear(),meta=y?ensureYear(y):{},sum=q('#neisSummary35'),alerts=q('#neisAlerts35'),log=q('#neisAudit35'),s=settings();
    if(sum){
      if(!s.apiKey)sum.innerHTML='<div class="neis35-empty">공식 Open API 인증키를 한 번 저장하면 이후 학교정보와 학사일정을 자동으로 동기화합니다.</div>';
      else if(!y)sum.innerHTML='<div class="neis35-empty">학년도를 설정하면 NEIS 공식 연결을 시작합니다.</div>';
      else{const school=result?.school||meta?.school||{},an=result?.timetable?.anomalies||meta?.anomalies||[],refs=result?.timetable?.refs||meta?.classRefs||[];sum.innerHTML=`<div><b>${esc(school.schoolName||'확인 중')}</b><span>공식 학교</span></div><div><b>${Number(result?.schedule?.officialCount??meta?.scheduleCount??0)}</b><span>학사일정</span></div><div><b>${refs.length}</b><span>내 학급 교차검증</span></div><div><b>${an.length}</b><span>시간표 변경 후보</span></div><div><b>${meta?.lastTimetableFailures||0}</b><span>재시도 대상</span></div>`}
    }
    if(alerts){const a=result?.timetable?.anomalies||meta?.anomalies||[];alerts.innerHTML=a.length?`<div class="neis35-section-title"><b>공식 시간표와 다른 항목</b><span>기존 시간표를 자동으로 덮어쓰지 않고 확인 할 일만 만듭니다.</span></div>`+a.slice(0,6).map(x=>`<div class="neis35-alert"><b>${esc(x.title)}</b><span>${esc(x.date)} · 공식 ${esc(x.actual)} / Teacher OS ${esc(x.expected)}</span></div>`).join(''):''}
    if(log){const rows=audits().slice(-5).reverse();log.innerHTML=rows.length?`<div class="neis35-section-title"><b>NEIS 자동화 기록</b><span>인증키 값은 기록하지 않습니다.</span></div>`+rows.map(x=>`<div class="neis35-log"><time>${esc(new Date(x.at).toLocaleString('ko-KR'))}</time><span>${esc(x.message)}</span></div>`).join(''):''}
    renderSettings();
  }

  function schedule(){if(timer)clearTimeout(timer);const s=settings();if(!s.autoSync||!s.apiKey)return;const ms=Math.max(1,Number(s.intervalHours)||6)*3600000;timer=setTimeout(()=>syncNow(false),ms)}
  function maybeAuto(){const y=currentYear(),s=settings();if(!y||!s.apiKey||!s.autoSync){renderResult(null);return}const meta=ensureYear(y),last=Date.parse(meta.lastSuccessAt||'')||0;if(Date.now()-last>Math.max(1,Number(s.intervalHours)||6)*3600000)setTimeout(()=>syncNow(false),700);else{lastResult={school:meta.school,schedule:{officialCount:meta.scheduleCount||0},timetable:{refs:meta.classRefs||[],anomalies:meta.anomalies||[],failed:meta.lastTimetableFailures||0},at:meta.lastSuccessAt};renderResult(lastResult);setStatus('NEIS 공식 연결 정상','ok');schedule()}}

  globalThis.TeacherOSNeis35={sync:syncNow,settings};
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);setTimeout(()=>{ensureUI();renderResult(lastResult)},0);return r};
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);setTimeout(()=>ensureUI(),0);return r};
  setTimeout(()=>{ensureUI();maybeAuto();const foot=q('.side-foot');if(foot)foot.textContent='v0.35 · NEIS official connector'},0);
})();
