(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.TeacherOSIntegrationCore34=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const arr=v=>Array.isArray(v)?v:[];
  const txt=v=>String(v??'').trim();

  function normalizeGatewayUrl(value){
    const raw=txt(value);
    if(!raw)return'';
    let u;
    try{u=new URL(raw)}catch{return''}
    if(u.protocol!=='https:')return'';
    const okHost=/^(script\.google\.com|script\.googleusercontent\.com)$/i.test(u.hostname);
    if(!okHost)return'';
    if(!/\/macros\/s\//.test(u.pathname)&&u.hostname==='script.google.com')return'';
    return u.href.replace(/[#?].*$/,'');
  }

  function sourceKey(item){
    return [txt(item?.source),txt(item?.externalId||item?.id),txt(item?.date),txt(item?.title)].join('|');
  }

  function existingExternalKeys(year){
    const out=new Set();
    ['calendarEvents','projects','assessments','tasks'].forEach(k=>arr(year?.[k]).forEach(x=>{
      const k1=txt(x?.externalKey||x?.agentExternalKey||x?.googleExternalKey);
      if(k1)out.add(k1);
    }));
    return out;
  }

  function safeType(item){
    const source=txt(item?.source);
    const category=txt(item?.category);
    const confidence=Number(item?.confidence)||0;
    const authoritative=item?.authoritative===true;
    const date=txt(item?.date);
    if(source==='calendar'&&date)return'calendar';
    if(category==='assessment'&&authoritative&&date&&confidence>=0.9)return'assessment';
    if(category==='admin'&&date&&confidence>=0.8)return'project';
    if((category==='assessment'||category==='admin'||category==='calendar')&&confidence>=0.65)return'task';
    return'';
  }

  function planSafeChanges(year,snapshot){
    const items=arr(snapshot?.items),existing=existingExternalKeys(year),changes=[];
    for(const item of items){
      const key=sourceKey(item);if(!key||existing.has(key))continue;
      const type=safeType(item);if(!type)continue;
      const base={externalKey:key,googleExternalKey:key,agentGenerated:true,source:`Google 자동동기화 · ${txt(item.source)||'source'}`,sourceDetail:txt(item.sourceDetail||item.title),confidence:Number(item.confidence)||0,createdAt:new Date().toISOString()};
      if(type==='calendar')changes.push({type,key,record:{...base,id:'gcal-'+hash36(key),date:txt(item.date),title:txt(item.title)||'Google Calendar 일정',type:'Google Calendar',readonly:true,externalId:txt(item.externalId)}});
      if(type==='project')changes.push({type,key,record:{...base,id:'gproj-'+hash36(key),name:txt(item.title)||'자동 감지 업무',desc:txt(item.summary||item.sourceDetail),due:txt(item.date),externalId:txt(item.externalId)}});
      if(type==='assessment')changes.push({type,key,record:{...base,id:'gass-'+hash36(key),name:txt(item.title)||'자동 감지 평가',due:txt(item.date),target:txt(item.target),weight:txt(item.weight),externalId:txt(item.externalId),provisional:false}});
      if(type==='task')changes.push({type,key,record:{...base,id:'gtask-'+hash36(key),text:buildTaskText(item),done:false,agentExternalKey:key,externalId:txt(item.externalId)}});
      existing.add(key);
    }
    return changes;
  }

  function buildTaskText(item){
    const when=item?.date?` (${txt(item.date)})`:'';
    const source=item?.source?` · ${txt(item.source)}`:'';
    return `${txt(item?.title)||'확인 필요'}${when}${source}`;
  }

  function applySafeChanges(year,changes){
    if(!year||typeof year!=='object')return{applied:0,byType:{}};
    year.calendarEvents=arr(year.calendarEvents);year.projects=arr(year.projects);year.assessments=arr(year.assessments);year.tasks=arr(year.tasks);
    const byType={calendar:0,project:0,assessment:0,task:0};let applied=0;
    for(const c of arr(changes)){
      if(c.type==='calendar'){year.calendarEvents.push(c.record);byType.calendar++;applied++}
      else if(c.type==='project'){year.projects.push(c.record);byType.project++;applied++}
      else if(c.type==='assessment'){year.assessments.push(c.record);byType.assessment++;applied++}
      else if(c.type==='task'){year.tasks.push(c.record);byType.task++;applied++}
    }
    return{applied,byType};
  }

  function riskLevel(action){
    const t=txt(action?.type);
    if(['gmail_send','gmail_delete','drive_delete','drive_move','drive_share','calendar_update_existing','calendar_delete'].includes(t))return'high';
    if(['calendar_create_dedicated','task_add','project_add','mirror_calendar','label_local'].includes(t))return'low';
    return'medium';
  }

  function mayAutoExecute(action){return riskLevel(action)==='low'&&action?.requiresApproval!==true}

  function retryDelayMs(attempt){
    const n=Math.max(0,Number(attempt)||0);
    return Math.min(5*60*1000,1000*Math.pow(2,Math.min(n,8)));
  }

  function summarizeSnapshot(snapshot){
    const items=arr(snapshot?.items),approvals=arr(snapshot?.approvals),health=snapshot?.health||{};
    return{
      gmail:items.filter(x=>x.source==='gmail').length,
      drive:items.filter(x=>x.source==='drive').length,
      calendar:items.filter(x=>x.source==='calendar').length,
      approvals:approvals.filter(x=>x.status==='pending'||!x.status).length,
      healthy:health.ok===true,
      lastScanAt:txt(health.lastScanAt||snapshot?.lastScanAt)
    };
  }

  function hash36(s){
    let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0).toString(36);
  }

  return{normalizeGatewayUrl,sourceKey,safeType,planSafeChanges,applySafeChanges,riskLevel,mayAutoExecute,retryDelayMs,summarizeSnapshot,hash36};
});
