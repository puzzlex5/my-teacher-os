(function(){
  const T=globalThis.TeacherOSDataTruth,D=globalThis.TeacherOSDeskCore,S=globalThis.TeacherOSStorage;if(!T||!D)return;
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const COLLECTOR_STATE_PERSIST_MS29=60000;
  let checkingCollector29=false;
  function y29(){try{return typeof cur==='function'?cur():null}catch{return null}}
  async function syncCollectorTruth29(){if(checkingCollector29)return;const y=y29();if(!y)return;checkingCollector29=true;try{const r=await fetch('./live/comcigan-status.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)return;const s=await r.json();if(s?.status!=='error')return;y.comciganSync=y.comciganSync&&typeof y.comciganSync==='object'?y.comciganSync:{};const category=String(s.category||'runtime'),detail=String(s.detail||'runtime'),last=Date.parse(y.comciganSync.lastChecked||'')||0,changed=y.comciganSync.status!=='collector-error'||y.comciganSync.errorCategory!==category||y.comciganSync.errorDetail!==detail,due=!last||Date.now()-last>=COLLECTOR_STATE_PERSIST_MS29;if(!changed&&!due)return;y.comciganSync.status='collector-error';y.comciganSync.errorCategory=category;y.comciganSync.errorDetail=detail;y.comciganSync.lastChecked=new Date().toISOString();try{S?.writeJSON(KEY,state)}catch{} }catch{}finally{checkingCollector29=false}}
  function truth29(){const y=y29();if(!y)return null;const d=D.lessonContext(y,new Date());return{y,d,truth:T.nextLessonTruth(y,d)}}
  function correctNextLessonTruth(){
    const box=q('#deskNext27'),x=truth29();if(!box||!x||x.truth.known)return;
    const truth=x.truth;
    box.innerHTML=`<div class="desk-next-top27"><span class="desk-status27">${esc(truth.label)}</span><span class="mini">확정 가능한 시간표 없음</span></div><h3>오늘 수업 여부를 확정할 수 없습니다.</h3><div class="desk-progress27"><span>${truth.reason==='collector-error'?'컴시간 수집기가 최신표를 가져오지 못했습니다. 이전 표를 현재표로 간주하지 않습니다.':'컴시간 실제표와 기본 시간표가 모두 확인되지 않았습니다. 0건으로 처리하지 않습니다.'}</span></div><div class="desk-next-foot27"><button type="button" class="btn secondary tiny" data-go27="timetable">시간표 확인</button></div>`;
  }
  function correctTodayTimetableTruth(){
    const box=q('#todayTimetable'),x=truth29();if(!box||!x||x.truth.known)return;
    box.innerHTML=`<span class="muted"><b>${esc(x.truth.label)}</b> · ${x.truth.reason==='collector-error'?'최신표 수집에 실패했습니다. 이전 표를 현재 수업 없음의 근거로 사용하지 않습니다.':'아직 실제표를 확인하지 못했습니다. 수업 없음으로 처리하지 않습니다.'}</span>`;
  }
  function refresh29(){setTimeout(async()=>{await syncCollectorTruth29();correctNextLessonTruth();correctTodayTimetableTruth();const foot=q('.side-foot');if(foot)foot.textContent='v0.29 · verified data states'},0)}
  refresh29();
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh29();return r};
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='dashboard'||id==='timetable')refresh29();return r};
})();
