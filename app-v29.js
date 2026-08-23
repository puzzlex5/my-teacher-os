(function(){
  const T=globalThis.TeacherOSDataTruth,D=globalThis.TeacherOSDeskCore;if(!T||!D)return;
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function y29(){try{return typeof cur==='function'?cur():null}catch{return null}}
  function correctNextLessonTruth(){
    const box=q('#deskNext27'),y=y29();if(!box||!y)return;
    const d=D.lessonContext(y,new Date()),truth=T.nextLessonTruth(y,d);if(truth.known)return;
    box.innerHTML=`<div class="desk-next-top27"><span class="desk-status27">${esc(truth.label)}</span><span class="mini">확정 가능한 시간표 없음</span></div><h3>오늘 수업 여부를 확정할 수 없습니다.</h3><div class="desk-progress27"><span>컴시간 실제표와 기본 시간표가 모두 확인되지 않았습니다. 0건으로 처리하지 않습니다.</span></div><div class="desk-next-foot27"><button type="button" class="btn secondary tiny" data-go27="timetable">시간표 확인</button></div>`;
  }
  function refresh29(){setTimeout(()=>{correctNextLessonTruth();const foot=q('.side-foot');if(foot)foot.textContent='v0.29 · verified data states'},0)}
  refresh29();
  const prevRender=globalThis.render;if(typeof prevRender==='function')globalThis.render=function(){const r=prevRender.apply(this,arguments);refresh29();return r};
  const prevSwitch=globalThis.switchView;if(typeof prevSwitch==='function')globalThis.switchView=function(id){const r=prevSwitch.apply(this,arguments);if(id==='dashboard'||id==='timetable')refresh29();return r};
})();
