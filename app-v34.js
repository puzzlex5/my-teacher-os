(function(){
  const I=globalThis.TeacherOSIntegrationCore34;if(!I)return;
  const q=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const SETTINGS_KEY='myTeacherOS.google34.settings.v1',STATE_KEY='myTeacherOS.google34.state.v1',AUDIT_KEY='myTeacherOS.google34.audit.v1',CHANNEL='teacher-os-google-v34';
  let frame=null,ready=false,busy=false,lastSnapshot=null,pending=new Map(),requestSeq=0,timer=null;

  function settings(){try{return Object.assign({gatewayUrl:'',autoSync:true,syncMinutes:3},JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'))}catch{return{gatewayUrl:'',autoSync:true,syncMinutes:3}}}
  function writeSettings(v){localStorage.setItem(SETTINGS_KEY,JSON.stringify(v))}
  function readState(){try{return Object.assign({cursor:0,lastSyncAt:'',lastError:'',connected:false},JSON.parse(localStorage.getItem(STATE_KEY)||'{}'))}catch{return{cursor:0,lastSyncAt:'',lastError:'',connected:false}}}
  function writeState(v){localStorage.setItem(STATE_KEY,JSON.stringify(v))}
  function currentYear(){try{return typeof cur==='function'?cur():null}catch{return null}}
  function directSave(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){console.error('Teacher OS Google sync save',e);return false}}
  function localAudit(event,message,extra){let a=[];try{a=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]');if(!Array.isArray(a))a=[]}catch{}a.push({at:new Date().toISOString(),event,message,extra:extra||{}});a=a.slice(-250);try{localStorage.setItem(AUDIT_KEY,JSON.stringify(a))}catch{}return a}
  function getLocalAudit(){try{const a=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}

  function ensureUI(){
    const dash=q('#dashboardBody');if(dash&&!q('#googleAutopilot34')){
      const anchor=q('#workAgent33')||q('#policyBanner');
      const html=`<article id="googleAutopilot34" class="card google34 spaced"><div class="google34-head"><div><span class="kicker">GOOGLE AUTOPILOT · STAGE 5</span><h2>Gmail · Drive · Calendar 자동화</h2><p class="muted">백그라운드에서 새 업무를 감지하고, 안전한 항목은 Teacher OS에 자동 반영합니다. 기존 일정 변경·삭제·외부 발송은 승인 없이는 실행하지 않습니다.</p></div><div class="google34-actions"><span id="googleStatus34" class="google34-status pending">연결 확인 중</span><button class="btn primary tiny" id="googleSync34" type="button">지금 동기화</button></div></div><div id="googleSummary34" class="google34-summary"></div><div id="googleApprovals34" class="google34-approvals"></div><div id="googleAudit34" class="google34-audit"></div></article>`;
      if(anchor)anchor.insertAdjacentHTML('afterend',html);else dash.insertAdjacentHTML('afterbegin',html);
      q('#googleSync34')?.addEventListener('click',()=>syncNow(true));
      q('#googleApprovals34')?.addEventListener('click',onApprovalClick);
    }
    const settingsView=q('#settings');if(settingsView&&!q('#googleSettings34')){
      const panel=`<article id="googleSettings34" class="card google34-settings spaced"><div class="head"><div><span class="kicker">GOOGLE AUTOMATION GATEWAY</span><h3>완전 자동화 연결</h3><p class="muted">Google Apps Script는 Gmail·Drive·Calendar를 비공개로 읽고 15분마다 감지합니다. 데이터는 공개 GitHub에 저장하지 않습니다.</p></div></div><label class="google34-label">Apps Script Web App 주소<input id="googleGateway34" class="field" type="url" autocomplete="off" placeholder="https://script.google.com/macros/s/.../exec"></label><div class="quick"><button class="btn primary" id="googleSave34" type="button">연결 저장</button><button class="btn secondary" id="googleOpen34" type="button">Gateway 열어 승인</button><button class="btn secondary" id="googleRepair34" type="button">자동화 복구</button></div><div class="google34-toggle-row"><label><input type="checkbox" id="googleAuto34"> 사이트 열려 있을 때 자동 동기화</label><label><input type="checkbox" id="googleReminder34"> 전용 Calendar에 안전 알림 자동 생성</label></div><label class="google34-label">Gmail 감지 검색식<input id="googleQuery34" class="field" type="text" placeholder="newer_than:7d (공문 OR 제출 OR 마감 ...)"></label><div class="mini" id="googleSetupHelp34">최초 1회 Apps Script를 본인 계정으로 배포하고 주소를 붙여 넣으면 이후에는 버튼 없이 작동합니다. 백그라운드 수집은 사이트를 닫아도 계속됩니다.</div></article>`;
      const health=settingsView.querySelector('.health-grid')||settingsView.querySelector('.section-intro');
      if(health)health.insertAdjacentHTML('afterend',panel);else settingsView.insertAdjacentHTML('afterbegin',panel);
      bindSettingsUI();
    }
    renderSettingsUI();
  }

  function bindSettingsUI(){
    q('#googleSave34')?.addEventListener('click',()=>{
      const url=I.normalizeGatewayUrl(q('#googleGateway34')?.value||'');
      if(!url){setStatus('Apps Script Web App 주소가 올바르지 않습니다.','fail');return}
      const s=settings();s.gatewayUrl=url;s.autoSync=!!q('#googleAuto34')?.checked;writeSettings(s);writeState({...readState(),cursor:0,connected:false,lastError:''});localAudit('config','Google Gateway 주소를 저장했습니다.');mountBridge(true);
    });
    q('#googleOpen34')?.addEventListener('click',()=>{const u=I.normalizeGatewayUrl(q('#googleGateway34')?.value||settings().gatewayUrl);if(u)window.open(u,'_blank','noopener')});
    q('#googleRepair34')?.addEventListener('click',async()=>{try{setStatus('자동화 복구 중…','pending');const h=await rpc('apiRepairAutomation',[],2);localAudit('repair','Google 자동화 트리거를 점검/복구했습니다.',h);await syncNow(true)}catch(e){setStatus('복구 실패 · '+String(e.message||e),'fail')}});
    q('#googleAuto34')?.addEventListener('change',e=>{const s=settings();s.autoSync=!!e.target.checked;writeSettings(s);schedule();renderSettingsUI()});
    q('#googleReminder34')?.addEventListener('change',async e=>{try{await rpc('apiSaveConfig',[{autoReminders:!!e.target.checked}],2);await syncNow(false)}catch(err){setStatus('설정 저장 실패 · '+String(err.message||err),'fail')}});
    q('#googleQuery34')?.addEventListener('change',async e=>{const v=String(e.target.value||'').trim();if(!v)return;try{await rpc('apiSaveConfig',[{gmailQuery:v}],2);localAudit('config','Gmail 자동 감지 검색식을 갱신했습니다.');await syncNow(false)}catch(err){setStatus('검색식 저장 실패 · '+String(err.message||err),'fail')}});
  }

  function renderSettingsUI(){
    const s=settings(),snap=lastSnapshot;
    const inp=q('#googleGateway34');if(inp&&!inp.matches(':focus'))inp.value=s.gatewayUrl||'';
    const a=q('#googleAuto34');if(a)a.checked=!!s.autoSync;
    const r=q('#googleReminder34');if(r)r.checked=snap?.config?.autoReminders!==false;
    const g=q('#googleQuery34');if(g&&snap?.config?.gmailQuery&&!g.matches(':focus'))g.value=snap.config.gmailQuery;
  }

  function mountBridge(force=false){
    ensureUI();const url=I.normalizeGatewayUrl(settings().gatewayUrl);
    if(!url){ready=false;setStatus('Google 연결 필요','pending');renderSnapshot(null);return}
    if(frame&&!force&&frame.dataset.url===url)return;
    if(frame)frame.remove();ready=false;rejectAllPending(new Error('Gateway 재연결'));
    frame=document.createElement('iframe');frame.id='teacherGoogleBridge34';frame.dataset.url=url;frame.src=url+(url.includes('?')?'&':'?')+'teacher_os=34&ts='+Date.now();frame.referrerPolicy='no-referrer';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:0;left:-9999px;top:-9999px';document.body.appendChild(frame);
    setStatus('Google Gateway 연결 중…','pending');
    setTimeout(()=>{if(!ready){setStatus('Google 승인 필요 · 설정에서 Gateway 열기','warn');renderSnapshot(lastSnapshot)}},7000);
  }

  function rejectAllPending(err){for(const p of pending.values()){clearTimeout(p.timeout);p.reject(err)}pending.clear()}
  function onMessage(e){
    const d=e.data;if(!d||d.channel!==CHANNEL)return;
    const url=I.normalizeGatewayUrl(settings().gatewayUrl);if(!url)return;
    let gatewayOrigin='';try{gatewayOrigin=new URL(url).origin}catch{}
    if(e.origin!==gatewayOrigin&&e.origin!=='https://script.googleusercontent.com')return;
    if(d.type==='ready'){ready=true;writeState({...readState(),connected:true,lastError:''});setStatus('Google 자동화 연결됨','ok');syncNow(false);schedule();return}
    if(d.id&&pending.has(d.id)){const p=pending.get(d.id);pending.delete(d.id);clearTimeout(p.timeout);d.ok?p.resolve(d.result):p.reject(new Error(d.error||'Google Gateway 오류'))}
  }

  function rpc(method,args=[],retries=2){
    return new Promise((resolve,reject)=>{
      const attempt=n=>{
        if(!frame||!frame.contentWindow){mountBridge();if(n>retries){reject(new Error('Google Gateway가 준비되지 않았습니다.'));return}setTimeout(()=>attempt(n+1),I.retryDelayMs(n));return}
        const id='g34-'+(++requestSeq)+'-'+Date.now();
        const timeout=setTimeout(()=>{pending.delete(id);if(n<retries)setTimeout(()=>attempt(n+1),I.retryDelayMs(n));else reject(new Error('Google Gateway 응답 시간 초과'))},12000+4000*n);
        pending.set(id,{resolve,reject,timeout});
        frame.contentWindow.postMessage({channel:CHANNEL,id,method,args},'*');
      };attempt(0);
    });
  }

  async function syncNow(manual=false){
    if(busy)return;if(!I.normalizeGatewayUrl(settings().gatewayUrl)){ensureUI();setStatus('Google 연결 필요','pending');return}
    busy=true;const btn=q('#googleSync34');if(btn)btn.disabled=true;
    try{
      if(!frame)mountBridge();
      const st=readState(),y=currentYear();
      const cursor=y?Number(st.cursor||0):0;
      setStatus('Gmail · Drive · Calendar 동기화 중…','pending');
      const snap=await rpc('apiSyncSnapshot',[cursor],2);lastSnapshot=snap;
      let applied={applied:0,byType:{}};
      if(y){
        const plan=I.planSafeChanges(y,snap);applied=I.applySafeChanges(y,plan);
        if(applied.applied){directSave();localAudit('auto-apply',`안전 항목 ${applied.applied}건을 Teacher OS에 자동 반영했습니다.`,applied.byType)}
        writeState({...st,cursor:Number(snap.cursor||st.cursor||0),lastSyncAt:new Date().toISOString(),lastError:'',connected:true});
        if(applied.applied&&typeof globalThis.render==='function'){try{globalThis.render()}catch{}}
        if(typeof globalThis.TeacherOSAgent33?.run==='function')setTimeout(()=>globalThis.TeacherOSAgent33.run(false),0);
      }else{
        writeState({...st,lastSyncAt:new Date().toISOString(),lastError:'',connected:true});
      }
      renderSnapshot(snap,applied);const h=snap.health||{};
      setStatus(h.ok?'완전 자동화 정상':'자동화 점검 필요',h.ok?'ok':'warn');
      if(manual)localAudit('sync','사용자 요청 동기화를 완료했습니다.',{cursor:snap.cursor,applied:applied.applied});
    }catch(e){
      const msg=String(e?.message||e);writeState({...readState(),lastError:msg,connected:false});localAudit('failure','Google 자동 동기화 실패',{error:msg});setStatus('동기화 실패 · 자동 재시도 예정','fail');renderSnapshot(lastSnapshot);
    }finally{busy=false;if(btn)btn.disabled=false;schedule()}
  }

  function renderSnapshot(snap,applied){
    ensureUI();const sum=q('#googleSummary34'),ap=q('#googleApprovals34'),audit=q('#googleAudit34');
    if(sum){
      if(!snap)sum.innerHTML='<div class="google34-empty">Apps Script Gateway를 한 번 연결하면 Gmail·Drive·Calendar가 자동으로 들어옵니다.</div>';
      else{const s=I.summarizeSnapshot(snap),h=snap.health||{};sum.innerHTML=`<div><b>${s.gmail}</b><span>새 Gmail</span></div><div><b>${s.drive}</b><span>새 Drive</span></div><div><b>${s.calendar}</b><span>Calendar</span></div><div><b>${s.approvals}</b><span>승인 필요</span></div><div><b>${Number(applied?.applied||0)}</b><span>이번 자동반영</span></div><div><b>${h.ageMinutes==null?'—':h.ageMinutes+'분'}</b><span>백그라운드 점검</span></div>`}
    }
    if(ap){
      const approvals=(snap?.approvals||[]).filter(x=>x.status==='pending');
      ap.innerHTML=approvals.length?`<div class="google34-section-title"><b>승인 필요한 작업</b><span>기존 일정 변경·삭제·외부 발송은 여기서만 승인합니다.</span></div>`+approvals.map(x=>`<div class="google34-approval"><div><b>${esc(x.title||x.type)}</b><div class="mini">${esc(x.reason||'사용자 판단이 필요한 작업입니다.')}</div></div><div class="google34-approval-actions"><button class="btn primary tiny" data-g34-approve="${esc(x.id)}">확인</button><button class="btn secondary tiny" data-g34-reject="${esc(x.id)}">보류</button></div></div>`).join(''):'';
    }
    if(audit){
      const server=(snap?.audit||[]).slice(-6),local=getLocalAudit().slice(-4),rows=[...server.map(x=>({...x,scope:'Google'})),...local.map(x=>({...x,scope:'Teacher OS'}))].sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,8);
      audit.innerHTML=rows.length?`<div class="google34-section-title"><b>자동화 기록</b><span>언제 · 무엇을 · 왜 했는지 남깁니다.</span></div>`+rows.map(x=>`<div class="google34-log"><time>${esc(formatWhen(x.at))}</time><span>${esc(x.message||x.event||'자동화')}</span><em>${esc(x.scope||x.source||'')}</em></div>`).join(''):'';
    }
    renderSettingsUI();
  }

  async function onApprovalClick(e){
    const a=e.target.closest('[data-g34-approve]'),r=e.target.closest('[data-g34-reject]');if(!a&&!r)return;
    const id=(a?.dataset.g34Approve||r?.dataset.g34Reject||'');if(!id)return;
    try{e.target.disabled=true;await rpc(a?'apiApproveAction':'apiRejectAction',[id],1);localAudit('approval',`${a?'승인 확인':'보류'} · ${id}`);await syncNow(false)}catch(err){setStatus('승인 처리 실패 · '+String(err.message||err),'fail')}finally{e.target.disabled=false}
  }

  function setStatus(text,kind){ensureUI();const el=q('#googleStatus34');if(el){el.textContent=text;el.className='google34-status '+(kind||'pending')}}
  function formatWhen(v){try{return new Date(v).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return String(v||'')}}
  function schedule(){if(timer)clearTimeout(timer);timer=null;const s=settings();if(!s.autoSync||!s.gatewayUrl)return;const ms=Math.max(1,Number(s.syncMinutes)||3)*60*1000;timer=setTimeout(()=>{if(document.visibilityState==='visible'&&navigator.onLine!==false)syncNow(false);else schedule()},ms)}
  function refresh(){ensureUI();mountBridge();renderSnapshot(lastSnapshot);schedule();const foot=q('.side-foot');if(foot)foot.textContent='v0.34 · Google autopilot stage 5'}

  window.addEventListener('message',onMessage);
  window.addEventListener('online',()=>syncNow(false));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&settings().autoSync)syncNow(false)});
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='dashboard'||id==='settings')setTimeout(()=>{ensureUI();renderSnapshot(lastSnapshot)},0);return r};
  globalThis.TeacherOSGoogle34={sync:syncNow,settings,health:()=>lastSnapshot?.health||null};
  setTimeout(refresh,0);
})();
