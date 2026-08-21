(function(){
  if(!location.hash.startsWith('#timetable='))return;
  try{
    const token=location.hash.slice('#timetable='.length).replace(/-/g,'+').replace(/_/g,'/');
    const pad='='.repeat((4-token.length%4)%4);
    const json=decodeURIComponent(escape(atob(token+pad)));
    const slots=JSON.parse(json);
    if(!Array.isArray(slots)||!slots.length)throw new Error('시간표 데이터가 없습니다.');
    const y=cur();
    if(!y){alert('학년도를 먼저 만든 뒤 같은 링크를 다시 열어 주세요.');return}
    if(!confirm(`시간표 사진에서 읽은 ${slots.length}개 수업을 ${y.year}학년도 시간표에 적용할까요?`))return;
    y.timetable=Array.isArray(y.timetable)?y.timetable:[];
    slots.forEach(s=>{
      const target=globalThis.TeacherOSCoreV6.normalizeScope(s.target||'');
      const exists=y.timetable.some(x=>x.day===s.day&&Number(x.period)===Number(s.period)&&globalThis.TeacherOSCoreV6.normalizeScope(x.target||globalThis.TeacherOSCoreV6.targetFromLabel(x.label))===target);
      if(!exists)y.timetable.push({id:crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random(),day:s.day,period:Number(s.period),target,subject:s.subject||'음악',label:s.label||`${target} ${s.subject||'음악'}`,time:s.time||'',source:'시간표 사진에서 가져옴'});
    });
    history.replaceState(null,'',location.pathname+location.search);
    save();
    alert('시간표를 적용했습니다. 시간표 메뉴에서 언제든 수정할 수 있습니다.');
  }catch(e){alert('시간표 적용 실패: '+(e.message||e))}
})();
