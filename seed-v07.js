(function(){
  if(!location.hash.startsWith('#liveweek='))return;
  try{
    const token=location.hash.slice('#liveweek='.length).replace(/-/g,'+').replace(/_/g,'/');
    const pad='='.repeat((4-token.length%4)%4);
    const json=decodeURIComponent(escape(atob(token+pad)));
    const payload=JSON.parse(json);
    if(!payload||!payload.weekStart||!Array.isArray(payload.slots))throw new Error('주간 시간표 데이터가 없습니다.');
    const slots=payload.slots.map(s=>Array.isArray(s)?{date:s[0],day:s[1],period:Number(s[2]),target:s[3],subject:s[4]||'음악',label:`${s[3]} ${s[4]||'음악'}`,changed:true,source:payload.source||'컴시간 캡처'}:s);
    const y=cur();if(!y){alert('학년도를 먼저 만든 뒤 같은 링크를 다시 열어 주세요.');return}
    y.liveTimetableWeeks=y.liveTimetableWeeks&&typeof y.liveTimetableWeeks==='object'?y.liveTimetableWeeks:{};
    y.liveTimetableWeeks[payload.weekStart]={weekStart:payload.weekStart,source:payload.source||'대화에서 가져온 컴시간 캡처',updatedAt:new Date().toISOString(),slots};
    history.replaceState(null,'',location.pathname+location.search);
    save();
    alert('이번 주 실제 시간표를 적용했습니다. 기본 시간표는 그대로 보존됩니다.');
  }catch(e){alert('주간 시간표 적용 실패: '+(e.message||e))}
})();
