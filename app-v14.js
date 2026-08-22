(function(){
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const LOCAL_CFG_KEY='myTeacherOS.comciganConfig';
  let loading=false,config=null,lastPayload=null,baseConfig=null;
  function ensureYearSync(y){if(!y)return;y.liveTimetableWeeks=y.liveTimetableWeeks&&typeof y.liveTimetableWeeks==='object'?y.liveTimetableWeeks:{};y.comciganSync=y.comciganSync&&typeof y.comciganSync==='object'?y.comciganSync:{}}
  function readLocalConfig(){try{const x=JSON.parse(localStorage.getItem(LOCAL_CFG_KEY)||'null');return x&&typeof x==='object'?x:null}catch{return null}}
  function saveLocalConfig(next){localStorage.setItem(LOCAL_CFG_KEY,JSON.stringify(next));config={...(baseConfig||{}),...next};return config}
  async function loadConfig(){if(config)return config;let base={};try{const r=await fetch('./comcigan-config.json?v='+Date.now(),{cache:'no-store'});if(r.ok)base=await r.json()}catch{}baseConfig=base;config={...base,...(readLocalConfig()||{})};return config}
  function sameConfig(p,c){if(!p||!c)return false;const schoolOk=!c.schoolCode||Number(p.schoolCode)===Number(c.schoolCode);const teacherOk=!c.teacherIndex||Number(p.teacherIndex)===Number(c.teacherIndex);return schoolOk&&teacherOk}
  function ensureConfigDialog(){
    if(q('#comciganConfigDlg'))return;
    document.body.insertAdjacentHTML('beforeend',`<dialog id="comciganConfigDlg"><form class="modal" id="comciganConfigForm"><div class="modal-head"><div><span class="kicker">COMCIGAN</span><h2>컴시간 설정</h2><p class="muted">한 번 저장하면 이 브라우저에 계속 유지됩니다. 다시 변경할 때만 바뀝니다.</p></div><button type="button" class="close" id="comciganConfigClose">×</button></div><div class="stack spaced"><label>학교코드<input class="field" id="comciganSchoolCode" inputmode="numeric" required placeholder="예: 65231"></label><label>교사번호<input class="field" id="comciganTeacherIndex" inputmode="numeric" required placeholder="예: 37"></label><label>교사명<input class="field" id="comciganTeacherName" required placeholder="예: 홍길*"></label></div><div class="notice warning spaced">설정은 이 기기에만 저장됩니다. 현재 공개 자동수집 결과와 설정이 다르면 다른 교사의 시간표를 잘못 적용하지 않도록 자동 적용을 막습니다.</div><div class="modal-actions"><button type="button" class="btn secondary" id="comciganConfigCancel">취소</button><button class="btn primary">설정 저장</button></div></form></dialog>`);
    q('#comciganConfigClose').onclick=()=>q('#comciganConfigDlg').close();
    q('#comciganConfigCancel').onclick=()=>q('#comciganConfigDlg').close();
    q('#comciganConfigForm').onsubmit=ev=>{
      ev.preventDefault();
      const schoolCode=Number(q('#comciganSchoolCode').value||0),teacherIndex=Number(q('#comciganTeacherIndex').value||0),teacherName=q('#comciganTeacherName').value.trim();
      if(!schoolCode||!teacherIndex||!teacherName)return alert('학교코드, 교사번호, 교사명을 모두 입력하세요.');
      saveLocalConfig({enabled:true,schoolCode,teacherIndex,teacherName,syncHourKST:9});
      const y=typeof cur==='function'?cur():null;if(y){ensureYearSync(y);y.comciganSync.status='waiting';localStorage.setItem(KEY,JSON.stringify(state))}
      q('#comciganConfigDlg').close();renderPlainSyncCard();pullComcigan(true);
    };
  }
  function openConfigDialog(){ensureConfigDialog();const c=config||{};q('#comciganSchoolCode').value=c.schoolCode||'';q('#comciganTeacherIndex').value=c.teacherIndex||'';q('#comciganTeacherName').value=c.teacherName||'';q('#comciganConfigDlg').showModal()}
  async function pullComcigan(manual=false){
    if(loading)return false;const y=typeof cur==='function'?cur():null;if(!y)return false;ensureYearSync(y);loading=true;
    try{
      const r=await fetch('./live/comcigan.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('아직 자동동기화 결과가 없습니다.');
      const p=await r.json();if(!p||!p.weekStart||!Array.isArray(p.slots))throw new Error('컴시간 파일 형식이 올바르지 않습니다.');
      lastPayload=p;
      if(!sameConfig(p,config)){const e=new Error('저장한 학교·교사 설정과 현재 자동수집 결과가 다릅니다. 잘못된 시간표 적용을 막았습니다.');e.code='CONFIG_MISMATCH';throw e}
      y.liveTimetableWeeks[p.weekStart]={weekStart:p.weekStart,source:'컴시간 09:00 자동동기화',updatedAt:p.fetchedAt||new Date().toISOString(),slots:p.slots};
      y.comciganSync.lastChecked=new Date().toISOString();y.comciganSync.lastApplied=p.fetchedAt||new Date().toISOString();y.comciganSync.status='ok';
      localStorage.setItem(KEY,JSON.stringify(state));
      if(manual&&typeof render==='function')render();
      return true;
    }catch(err){
      y.comciganSync.lastChecked=new Date().toISOString();y.comciganSync.status=err?.code==='CONFIG_MISMATCH'?'mismatch':'waiting';localStorage.setItem(KEY,JSON.stringify(state));
      if(manual)alert('컴시간 최신표 확인: '+err.message);
      return false;
    }finally{loading=false;renderPlainSyncCard();lockTimetableReadOnly()}
  }
  function lockTimetableReadOnly(){
    const tt=q('#timetable');if(!tt)return;
    q('#ttAdd')?.remove();
    q('#ttExceptionAdd')?.remove();
    q('#ttExceptionList')?.closest('article')?.remove();
    q('#ttDlg')?.remove();
    q('#ttExceptionDlg')?.remove();
    const desc=tt.querySelector('.section-intro .muted');
    if(desc)desc.textContent='시간표는 컴시간에서 자동으로 가져옵니다. Teacher OS에서는 직접 수정하지 않습니다.';
    const notice=tt.querySelector('.notice');
    if(notice)notice.innerHTML='<b>자동 운영:</b> 기본 시간표는 참고용으로 보존하고, 컴시간에서 가져온 실제 주간표를 우선 사용합니다. 변경이 있으면 다음 자동 점검 때 반영됩니다.';
    const table=q('#timetableTable');
    if(table){
      table.classList.add('readonly-timetable');
      table.querySelectorAll('.cell-add').forEach(x=>x.remove());
      if(!table.dataset.readonlyGuard){
        table.dataset.readonlyGuard='1';
        table.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation()},true);
      }
    }
  }
  function renderPlainSyncCard(){
    const y=typeof cur==='function'?cur():null,box=q('#liveSyncCard');if(!box||!y)return;ensureYearSync(y);ensureConfigDialog();
    const p=lastPayload,last=p?.fetchedAt||y.comciganSync?.lastApplied,when=last?new Date(last).toLocaleString('ko-KR'):'아직 첫 동기화 전';
    const c=config||{},status=y.comciganSync.status||'waiting',ok=status==='ok',mismatch=status==='mismatch';
    box.innerHTML=`<div class="sync-auto"><div class="sync-auto-icon">↻</div><div class="sync-auto-meta"><b>컴시간 자동동기화</b><span>학교·교사 설정은 한 번 저장하면 다시 변경하기 전까지 이 기기에서 그대로 유지됩니다.</span></div><div class="sync-auto-time">매일 09:00</div></div><div class="sync-config"><span>학교코드 ${esc(c.schoolCode||'설정 중')}</span><span>교사번호 ${esc(c.teacherIndex||'설정 중')}</span><span>교사 ${esc(c.teacherName||p?.teacherName||'설정 중')}</span><span>최근 확인 ${esc(when)}</span></div><div class="sync-row spaced"><span class="pill ${ok?'':'warn'}">${ok?'자동 적용 중':mismatch?'설정 확인 필요':'첫 동기화 대기'}</span><span class="live-source">${mismatch?'저장한 설정과 현재 수집 결과가 달라 잘못된 시간표 적용을 차단했습니다.':'시간표 직접 수정 기능은 꺼져 있습니다. 컴시간 실제표가 있으면 자동으로 우선 사용합니다.'}</span><span style="flex:1"></span><button class="btn secondary tiny" id="comciganConfigEdit" type="button">컴시간 설정 변경</button><button class="btn secondary tiny" id="plainSyncNow" type="button">최신표 다시 불러오기</button></div>`;
    q('#comciganConfigEdit').onclick=openConfigDialog;
    q('#plainSyncNow').onclick=()=>pullComcigan(true);
    const old=q('#syncDlg');if(old)old.remove();
    lockTimetableReadOnly();
  }
  async function boot(){await loadConfig();ensureConfigDialog();lockTimetableReadOnly();const ok=await pullComcigan(false);if(ok&&typeof render==='function')render();renderPlainSyncCard();lockTimetableReadOnly();const foot=q('.side-foot');if(foot)foot.textContent='v0.14 · Comcigan auto · editable device config'}
  const previousRender=globalThis.render;if(typeof previousRender==='function'){globalThis.render=function(){const r=previousRender.apply(this,arguments);setTimeout(()=>{renderPlainSyncCard();lockTimetableReadOnly()},0);return r}}
  boot();
})();
