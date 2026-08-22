(function(){
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let loading=false,config=null,lastPayload=null;
  function ensureYearSync(y){if(!y)return;y.liveTimetableWeeks=y.liveTimetableWeeks&&typeof y.liveTimetableWeeks==='object'?y.liveTimetableWeeks:{};y.comciganSync=y.comciganSync&&typeof y.comciganSync==='object'?y.comciganSync:{}}
  async function loadConfig(){if(config)return config;try{const r=await fetch('./comcigan-config.json?v='+Date.now(),{cache:'no-store'});if(r.ok)config=await r.json()}catch{}return config||{}}
  async function pullComcigan(manual=false){
    if(loading)return false;const y=typeof cur==='function'?cur():null;if(!y)return false;ensureYearSync(y);loading=true;
    try{
      const r=await fetch('./live/comcigan.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('아직 자동동기화 결과가 없습니다.');
      const p=await r.json();if(!p||!p.weekStart||!Array.isArray(p.slots))throw new Error('컴시간 파일 형식이 올바르지 않습니다.');
      lastPayload=p;y.liveTimetableWeeks[p.weekStart]={weekStart:p.weekStart,source:'컴시간 09:00 자동동기화',updatedAt:p.fetchedAt||new Date().toISOString(),slots:p.slots};
      y.comciganSync.lastChecked=new Date().toISOString();y.comciganSync.lastApplied=p.fetchedAt||new Date().toISOString();y.comciganSync.status='ok';
      localStorage.setItem(KEY,JSON.stringify(state));
      if(manual&&typeof render==='function')render();
      return true;
    }catch(err){
      y.comciganSync.lastChecked=new Date().toISOString();y.comciganSync.status='waiting';localStorage.setItem(KEY,JSON.stringify(state));
      if(manual)alert('컴시간 최신표 확인: '+err.message);
      return false;
    }finally{loading=false;renderPlainSyncCard()}
  }
  function renderPlainSyncCard(){
    const y=typeof cur==='function'?cur():null,box=q('#liveSyncCard');if(!box||!y)return;ensureYearSync(y);
    const p=lastPayload,last=p?.fetchedAt||y.comciganSync?.lastApplied,when=last?new Date(last).toLocaleString('ko-KR'):'아직 첫 동기화 전';
    const c=config||{};box.innerHTML=`<div class="sync-auto"><div class="sync-auto-icon">↻</div><div class="sync-auto-meta"><b>컴시간 자동동기화</b><span>매일 오전 9시에 변경표를 확인하고 Teacher OS 실제 시간표에 자동 반영합니다.</span></div><div class="sync-auto-time">매일 09:00</div></div><div class="sync-config"><span>학교코드 ${esc(c.schoolCode||'설정 중')}</span><span>교사번호 ${esc(c.teacherIndex||'설정 중')}</span><span>교사 ${esc(c.teacherName||p?.teacherName||'설정 중')}</span><span>최근 확인 ${esc(when)}</span></div><div class="sync-row spaced"><span class="pill ${y.comciganSync.status==='ok'?'':'warn'}">${y.comciganSync.status==='ok'?'자동 적용 중':'첫 동기화 대기'}</span><span class="live-source">기본 시간표는 보존하고 컴시간 실제표가 있으면 우선 사용합니다.</span><span style="flex:1"></span><button class="btn secondary tiny" id="plainSyncNow" type="button">최신표 다시 불러오기</button></div>`;
    q('#plainSyncNow').onclick=()=>pullComcigan(true);
    const old=q('#syncDlg');if(old)old.remove();
  }
  async function boot(){await loadConfig();const ok=await pullComcigan(false);if(ok&&typeof render==='function')render();renderPlainSyncCard();const foot=q('.side-foot');if(foot)foot.textContent='v0.14 · Comcigan 09:00 auto sync'}
  const previousRender=globalThis.render;if(typeof previousRender==='function'){globalThis.render=function(){const r=previousRender.apply(this,arguments);setTimeout(renderPlainSyncCard,0);return r}}
  boot();
})();
