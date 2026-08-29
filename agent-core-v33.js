(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TeacherOSAgentCore33=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DAY=86400000;
  const arr=v=>Array.isArray(v)?v:[];
  const txt=v=>String(v??'').trim();

  function localDate(d){
    const x=d instanceof Date?d:new Date(d);
    if(Number.isNaN(x.getTime()))return'';
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  }
  function dueDays(date,now=new Date()){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(txt(date)))return null;
    const [y,m,d]=date.split('-').map(Number);
    const target=new Date(y,m-1,d),base=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.round((target-base)/DAY);
  }
  function action(id,severity,category,title,why,nextAction,targetView,extra={}){
    return {id,severity,category,title,why,nextAction,targetView,automatable:extra.automatable!==false,taskText:extra.taskText||nextAction,sourceId:extra.sourceId||'',date:extra.date||'',score:Number(extra.score)||0};
  }
  function buildActions(year,ctx={}){
    if(!year||typeof year!=='object')return[];
    const now=ctx.now instanceof Date?ctx.now:new Date(ctx.now||Date.now());
    const isNoClass=typeof ctx.isNoClassEvent==='function'?ctx.isNoClassEvent:(e=>/휴업|방학|공휴|재량휴업|체험학습|고사|시험|학교장재량/i.test(`${e?.title||''} ${e?.type||''}`));
    const out=[];
    const assessments=arr(year.assessments),projects=arr(year.projects),clubs=arr(year.clubs),events=arr(year.calendarEvents),tasks=arr(year.tasks),timetable=arr(year.timetable);

    if(ctx.policyPending){
      out.push(action('policy:latest','warning','정책','최신 교육청 지침 확인이 필요합니다.',`${year.year||''}학년도 ${year.educationOffice||'교육청'} 세부 지침이 아직 확정 데이터로 확인되지 않았습니다.`,'공식 지침 발표 여부를 확인하고 정책 자료를 갱신하세요.','policy',{taskText:'최신 교육청 평가·성적관리 지침 확인',score:80}));
    }
    if(!events.length){
      out.push(action('setup:calendar','critical','기초자료','학사일정이 없어 일정 판단이 불완전합니다.','휴업일·고사·행사 정보를 모르면 평가 충돌과 남은 수업 계산이 틀릴 수 있습니다.','학교 학사일정 파일을 자동세팅에 추가하세요.','importer',{automatable:false,score:100}));
    }
    if(assessments.length&&!timetable.length){
      out.push(action('setup:timetable','critical','기초자료','평가가 있지만 시간표가 없습니다.','평가일까지 실제 남은 수업 횟수를 계산할 수 없습니다.','교사 시간표 Excel/CSV를 자동세팅에 추가하세요.','importer',{automatable:false,score:96}));
    }

    assessments.forEach(a=>{
      const n=dueDays(a.due,now);if(n===null)return;
      const id=`assessment:${a.id||a.name||a.due}`;
      if(n<0)out.push(action(id+':overdue','critical','평가',`평가 일정이 ${Math.abs(n)}일 지났습니다 · ${txt(a.name)||'평가'}`,`등록된 평가일 ${a.due}가 지났습니다. 일정 변경·처리 완료 여부를 확인해야 합니다.`,`평가 일정과 실제 실시 여부를 확인하세요.`,'assessment',{sourceId:a.id,date:a.due,score:98}));
      else if(n<=3)out.push(action(id+':soon','critical','평가',`${n===0?'오늘':`D-${n}`} · ${txt(a.name)||'평가'}`,`평가일까지 시간이 거의 없습니다. 준비물·루브릭·학생 안내 누락 가능성이 큽니다.`,`평가 준비 상태와 안내·채점 기준을 최종 점검하세요.`,'assessment',{sourceId:a.id,date:a.due,score:94-n}));
      else if(n<=7)out.push(action(id+':week','warning','평가',`이번 주 평가 · ${txt(a.name)||'평가'}`,`평가일 ${a.due}까지 ${n}일 남았습니다.`,`평가 자료와 수업 진도를 이번 주 안에 점검하세요.`,'assessment',{sourceId:a.id,date:a.due,score:78-n}));
      const clash=events.find(e=>e?.date===a.due&&isNoClass(e));
      if(clash)out.push(action(id+`:conflict:${clash.id||clash.title||a.due}`,'critical','충돌',`평가일 충돌 · ${txt(a.name)||'평가'}`,`${a.due}에 '${txt(clash.title)||'수업 제외 일정'}'이 함께 등록되어 있습니다.`,`평가일 변경 여부 또는 학사일정 예외를 확인하세요.`,'assessment',{sourceId:a.id,date:a.due,score:110}));
    });

    projects.forEach(p=>{
      const n=dueDays(p.due,now);if(n===null)return;
      const base=`project:${p.id||p.name||p.due}`;
      if(n<0)out.push(action(base+':overdue','critical','행정',`행정 마감 ${Math.abs(n)}일 경과 · ${txt(p.name)||'업무'}`,`마감일 ${p.due}가 지났습니다.`,`제출 완료 여부를 확인하고 미완료면 즉시 처리하세요.`,'projects',{sourceId:p.id,date:p.due,score:108}));
      else if(n<=2)out.push(action(base+':soon','critical','행정',`${n===0?'오늘 마감':`D-${n}`} · ${txt(p.name)||'업무'}`,`행정 마감이 임박했습니다.`,`제출물·결재·첨부파일을 최종 확인하세요.`,'projects',{sourceId:p.id,date:p.due,score:102-n}));
      else if(n<=7)out.push(action(base+':week','warning','행정',`이번 주 마감 · ${txt(p.name)||'업무'}`,`마감일 ${p.due}까지 ${n}일 남았습니다.`,`이번 주 처리 순서에 넣으세요.`,'projects',{sourceId:p.id,date:p.due,score:82-n}));
    });

    clubs.forEach(c=>{
      const n=dueDays(c.due,now);if(n===null)return;
      const base=`club:${c.id||c.name||c.due}`;
      if(n<0)out.push(action(base+':overdue','warning','동아리',`동아리 일정 ${Math.abs(n)}일 경과 · ${txt(c.name)||'동아리'}`,`등록된 다음 일정 ${c.due}가 지났습니다.`,`다음 활동일을 갱신하거나 완료 여부를 정리하세요.`,'clubs',{sourceId:c.id,date:c.due,score:70}));
      else if(n<=5)out.push(action(base+':soon','warning','동아리',`${n===0?'오늘':`D-${n}`} · ${txt(c.name)||'동아리'}`,`다음 활동이 가깝습니다.`,`학생 안내·장소·준비물을 확인하세요.`,'clubs',{sourceId:c.id,date:c.due,score:68-n}));
    });

    const openTasks=tasks.filter(t=>!t?.done);
    if(openTasks.length>=8)out.push(action('tasks:backlog','warning','할 일',`미완료 임시 할 일 ${openTasks.length}개`,`예외성 할 일이 누적되어 우선순위가 흐려질 수 있습니다.`,'오늘 처리할 3개만 남기고 완료·삭제 여부를 정리하세요.','dashboard',{automatable:false,score:62}));

    const backupAge=Number(ctx.backupAgeDays);
    if(Number.isFinite(backupAge)&&backupAge>14){
      out.push(action('backup:stale','warning','데이터',backupAge>=999?'JSON 백업이 없습니다.':`JSON 백업 ${backupAge}일 경과`,'브라우저 데이터 유실 시 복구할 최신 백업이 없습니다.','백업·점검에서 JSON 백업을 내려받으세요.','settings',{automatable:false,score:76}));
    }

    return out.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'ko'));
  }
  function taskKeySet(tasks){return new Set(arr(tasks).map(t=>txt(t.agentKey)).filter(Boolean));}
  function safeTaskCandidates(actions,tasks){
    const existing=taskKeySet(tasks);
    return arr(actions).filter(a=>a.automatable&&a.severity!=='info'&&!existing.has(a.id)).map(a=>({agentKey:a.id,text:a.taskText,done:false,agentGenerated:true,agentCategory:a.category,createdAt:new Date().toISOString()}));
  }
  function summary(actions){
    const a=arr(actions);return{total:a.length,critical:a.filter(x=>x.severity==='critical').length,warning:a.filter(x=>x.severity==='warning').length,automatable:a.filter(x=>x.automatable).length};
  }
  return{dueDays,localDate,buildActions,safeTaskCandidates,summary};
});
