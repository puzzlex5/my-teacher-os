(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TeacherOSAutonomous40=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DAY=86400000,arr=v=>Array.isArray(v)?v:[],txt=v=>String(v??'').trim();
  function localDate(d=new Date()){const x=d instanceof Date?d:new Date(d);if(Number.isNaN(x.getTime()))return'';return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`}
  function dueDays(v,now=new Date()){if(!/^20\d{2}-\d{2}-\d{2}$/.test(txt(v)))return null;const [y,m,d]=v.split('-').map(Number),a=new Date(y,m-1,d),b=new Date(now.getFullYear(),now.getMonth(),now.getDate());return Math.round((a-b)/DAY)}
  function domain(title){const s=txt(title);if(/수행평가|지필평가|평가계획|성적/.test(s))return'assessment';if(/학생부|생활기록부|세특/.test(s))return'student_record';if(/출결|결석|지각|조퇴/.test(s))return'attendance';if(/공문|결재|기안|품의|예산|지출|정산|행정/.test(s))return'admin';if(/진도|수업/.test(s))return'lesson';if(/학사일정|협의회|연수|행사/.test(s))return'schedule';return'general'}
  function baseScore(entity,now){const n=dueDays(entity?.due,now);let score=0;if(n!==null){if(n<0)score+=120+Math.min(30,Math.abs(n)*3);else if(n===0)score+=118;else if(n<=2)score+=105-n*3;else if(n<=7)score+=80-n;else if(n<=14)score+=50-n/2}else score+=12;if(entity?.dueConflict)score+=45;if(Number(entity?.sourceCount)>=2)score+=Math.min(20,Number(entity.sourceCount)*5);const d=domain(entity?.title);if(d==='assessment')score+=12;if(d==='admin')score+=10;if(d==='student_record'||d==='attendance')score+=8;return Math.round(score)}
  function severity(score,n,conflict){if(conflict||n!==null&&n<0||score>=115)return'critical';if(n!==null&&n<=7||score>=75)return'warning';return'info'}
  function actionFor(entity,now){const n=dueDays(entity?.due,now),d=domain(entity?.title),score=baseScore(entity,now),sev=severity(score,n,!!entity?.dueConflict);let reason='여러 업무 정보를 종합해 우선순위를 계산했습니다.',next='관련 원본을 확인하고 다음 처리 단계를 정리하세요.',safe=false,task='';
    if(entity?.dueConflict){reason='연결된 원본들 사이에 마감일 차이가 있어 사람이 확인해야 합니다.';next='실제 기준 마감일을 확인하고 충돌을 해소하세요.'}
    else if(n!==null&&n<0){reason=`마감이 ${Math.abs(n)}일 지났지만 완료로 확인되지 않았습니다.`;next='완료 여부를 확인하고 미완료면 즉시 처리하세요.';safe=true;task=`[자동 우선] ${entity.title} · 마감 경과 확인`}
    else if(n===0){reason='오늘 마감 업무입니다.';next='오늘 안에 제출·입력·확인을 완료하세요.';safe=true;task=`[오늘 최우선] ${entity.title}`}
    else if(n!==null&&n<=2){reason=`마감까지 ${n}일 남았습니다.`;next=d==='assessment'?'평가 준비물·안내·입력 상태를 최종 점검하세요.':'제출물·첨부·결재 상태를 최종 점검하세요.';safe=true;task=`[D-${n}] ${entity.title} 최종 점검`}
    else if(n!==null&&n<=7){reason=`이번 주 안에 마감되는 업무입니다.`;next='이번 주 처리 순서에 포함하고 필요한 선행작업을 확인하세요.';safe=true;task=`[이번 주] ${entity.title} 준비`}
    else if(!entity?.due&&Number(entity?.sourceCount)>=2){reason='여러 시스템에서 같은 업무가 감지됐지만 기준 마감일이 없습니다.';next='공식 마감일을 한 번 확인하세요.';safe=false}
    return{id:`v40:${entity?.id||Math.random().toString(36).slice(2)}`,entityId:entity?.id||'',title:txt(entity?.title)||'통합 업무',due:txt(entity?.due),domain:d,severity:sev,score,reason,nextAction:next,autoSafe:safe&&!entity?.dueConflict,taskText:task,sourceCount:Number(entity?.sourceCount)||0,dueConflict:!!entity?.dueConflict};
  }
  function healthActions(ctx={}){const out=[];const add=(id,title,why,score)=>out.push({id:`v40:health:${id}`,entityId:'',title,domain:'system',severity:score>=100?'critical':'warning',score,reason:why,nextAction:'연결 상태를 확인하고 자동 재시도를 기다리거나 설정을 점검하세요.',autoSafe:false,taskText:'',sourceCount:0,dueConflict:false});
    if(ctx.desktopConfigured&&ctx.desktopConnected===false)add('desktop','Desktop Bridge 연결 확인','로컬 자동감지 에이전트가 현재 연결되지 않았습니다.',92);
    if(ctx.neisConfigured&&ctx.neisHealthy===false)add('neis','NEIS 공식 연결 확인','NEIS 공식 데이터 동기화가 최근 실패했습니다.',88);
    if(ctx.googleConfigured&&ctx.googleHealthy===false)add('google','Google Autopilot 연결 확인','Google 자동화 게이트웨이 상태 확인이 필요합니다.',84);
    return out;
  }
  function buildPlan(year,ctx={}){const now=ctx.now instanceof Date?ctx.now:new Date(ctx.now||Date.now()),entities=arr(year?.workEntities39).filter(x=>!x?.completed),actions=entities.map(e=>actionFor(e,now)).concat(healthActions(ctx));actions.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'ko'));const focus=actions.filter(x=>x.severity!=='info').slice(0,8);return{date:localDate(now),actions,focus,summary:{total:actions.length,critical:actions.filter(x=>x.severity==='critical').length,warning:actions.filter(x=>x.severity==='warning').length,autoSafe:actions.filter(x=>x.autoSafe).length,approvalOnly:actions.filter(x=>!x.autoSafe&&x.severity!=='info').length,conflicts:actions.filter(x=>x.dueConflict).length}}}
  function existingAgentKeys(tasks){return new Set(arr(tasks).map(x=>txt(x.agentKey)).filter(Boolean))}
  function safeTaskCandidates(plan,tasks,max=4){const seen=existingAgentKeys(tasks),today=txt(plan?.date),out=[];for(const a of arr(plan?.actions)){if(out.length>=max)break;if(!a.autoSafe||!a.taskText)continue;const key=`${a.id}:${today}`;if(seen.has(key))continue;out.push({agentKey:key,text:a.taskText,due:a.due||'',done:false,agentGenerated:true,agentCategory:'자율업무',autonomous40:true,sourceEntityId:a.entityId,priority:a.severity==='critical'?'high':'normal',createdAt:new Date().toISOString()});seen.add(key)}return out}
  function highRiskType(type){return ['gmail_send','gmail_delete','drive_delete','drive_move','drive_share','calendar_update_existing','calendar_delete','neis_submit','neis_score_write','student_record_commit','kedufine_send','kedufine_approve','finance_execute'].includes(txt(type))}
  function mayAutoExecute(op){return !!op&&!highRiskType(op.type)&&['task_add','local_reminder','local_index_rebuild','local_health_retry'].includes(txt(op.type))}
  return{localDate,dueDays,domain,baseScore,actionFor,healthActions,buildPlan,safeTaskCandidates,highRiskType,mayAutoExecute};
});
