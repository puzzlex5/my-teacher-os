(function(){
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  let applying=false,scheduled=false;

  function removeNode(sel){const el=q(sel);if(el)el.remove()}
  function text(el,value){if(el&&el.textContent!==value)el.textContent=value}

  function lockTimetableUI(){
    if(applying)return;applying=true;
    try{
      const section=q('#timetable');
      if(!section)return;
      section.classList.add('timetable-auto-only');

      // Remove all legacy manual timetable controls.
      removeNode('#ttAdd');
      removeNode('#ttExceptionAdd');
      removeNode('#ttDlg');
      removeNode('#ttExceptionDlg');
      const exceptionList=q('#ttExceptionList');
      exceptionList?.closest('article')?.remove();
      qa('#timetable .cell-add,#timetable [data-tt-add],#timetable [data-tt-edit]').forEach(el=>el.remove());

      const intro=section.querySelector('.section-intro');
      intro?.querySelector('.section-actions')?.remove();
      text(intro?.querySelector('h2'),'시간표');
      text(intro?.querySelector('.muted'),'컴시간 알리미에서 가져온 실제 시간표를 자동으로 사용합니다. Teacher OS에서 시간표를 직접 수정하지 않습니다.');

      const legacyNotice=[...section.querySelectorAll('.notice')].find(el=>/기본 시간표|날짜별|각 칸|수정/.test(el.textContent||''));
      if(legacyNotice)legacyNotice.innerHTML='<b>자동 관리:</b> 기본 시간표는 참고용 읽기 전용이며, 컴시간 실제표가 있으면 자동으로 우선 적용됩니다. 변경 사항은 직접 입력하지 않아도 됩니다.';

      const baseTable=q('#timetableTable');
      if(baseTable){
        baseTable.classList.remove('editable-timetable');
        baseTable.classList.add('readonly-timetable');
        baseTable.setAttribute('aria-label','기본 시간표 읽기 전용');
        qa('#timetableTable .cell-add').forEach(el=>el.remove());
        qa('#timetableTable td').forEach(td=>{
          td.removeAttribute('data-edit');td.removeAttribute('data-day');td.removeAttribute('data-period');
          td.style.cursor='default';
        });
      }

      const foot=q('.side-foot');if(foot)foot.textContent='v0.15 · Comcigan auto-only timetable';
    }finally{applying=false}
  }

  // Capture phase: legacy delegated click handlers never receive timetable clicks.
  document.addEventListener('click',ev=>{
    const table=ev.target.closest?.('#timetableTable');
    if(!table)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
  },true);

  function scheduleLock(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;lockTimetableUI()});
  }

  lockTimetableUI();
  requestAnimationFrame(lockTimetableUI);
  const observer=new MutationObserver(scheduleLock);
  const section=q('#timetable');if(section)observer.observe(section,{childList:true,subtree:true});

  const previousRender=globalThis.render;
  if(typeof previousRender==='function'){
    globalThis.render=function(){
      const result=previousRender.apply(this,arguments);
      scheduleLock();
      return result;
    };
  }
})();
