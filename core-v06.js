(function(root,factory){
  const api=factory(root&&root.TeacherOSCore?root.TeacherOSCore:null);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root){
    root.TeacherOSCoreV6=api;
    if(root.TeacherOSCore) api.patchBase(root.TeacherOSCore);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(base){
  const WEEKDAYS=['월','화','수','목','금'];
  const HARD_NO_CLASS_RE=/(방학|휴업|공휴일|재량휴업|개교기념|수학여행|현장체험|체험학습|졸업식|입학식|대체공휴일|임시공휴일|지필평가|중간고사|기말고사)/;
  const PARTIAL_RE=/(봉사|창체|창의적 체험|진로|교육과정|체육대회|축제|행사|동아리|안전교육|성교육|학교폭력예방|학년행사|예술제|공연)/;
  const arr=v=>Array.isArray(v)?v:[];
  function gradeFromTarget(target){
    const s=String(target||'').trim();
    let m=s.match(/^([1-3])\s*학년$/); if(m)return m[1];
    m=s.match(/^([1-3])\s*-\s*(\d{1,2})$/); if(m)return m[1];
    m=s.match(/\b([1-3])학년\b/); return m?m[1]:'';
  }
  function targetFromLabel(label){
    const s=String(label||'').trim();
    let m=s.match(/([1-3])\s*학년\s*([1-9]\d?)\s*반/); if(m)return `${m[1]}-${Number(m[2])}`;
    m=s.match(/\b([1-3])\s*-\s*([1-9]\d?)\b/); if(m)return `${m[1]}-${Number(m[2])}`;
    m=s.match(/(?:^|\s)([1-3])(\d{2})(?=\s|$|[가-힣A-Za-z])/);
    if(m){const cls=Number(m[2]);if(cls>=1&&cls<=30)return `${m[1]}-${cls}`}
    return '';
  }
  function normalizeScope(scope){
    const s=String(scope||'전체').trim();
    if(!s||s==='전교'||s==='전체학교'||s==='학교전체')return'전체';
    const t=targetFromLabel(s); if(t)return t;
    const g=gradeFromTarget(s); if(g&&/학년/.test(s))return `${g}학년`;
    return s;
  }
  function scopeMatches(scope,target){
    scope=normalizeScope(scope); target=normalizeScope(target);
    if(!scope||scope==='전체')return true;
    if(!target||target==='전체')return scope==='전체';
    if(scope.includes(','))return scope.split(',').some(x=>scopeMatches(x.trim(),target));
    const sg=gradeFromTarget(scope),tg=gradeFromTarget(target);
    if(scope.endsWith('학년')&&sg)return sg===tg;
    if(target.endsWith('학년')&&tg)return sg===tg;
    return scope===target;
  }
  function inferImpact(title){
    const s=String(title||'');
    if(HARD_NO_CLASS_RE.test(s))return'no-class';
    if(PARTIAL_RE.test(s))return'partial';
    return'none';
  }
  function eventBlocksTarget(ev,target){
    if(!ev||!scopeMatches(ev.scope||ev.targetScope||'전체',target))return false;
    const impact=ev.impact&&ev.impact!=='auto'?ev.impact:inferImpact(ev.title);
    return impact==='no-class';
  }
  function eventNeedsReview(ev,target){
    if(!ev||!scopeMatches(ev.scope||'전체',target))return false;
    const impact=ev.impact&&ev.impact!=='auto'?ev.impact:inferImpact(ev.title);
    return impact==='partial';
  }
  function slotTarget(slot){return normalizeScope(slot?.target||targetFromLabel(slot?.label||''))}
  function slotMatchesTarget(slot,target){
    const st=slotTarget(slot);
    if(!target)return true;
    if(!st)return String(slot?.label||'').includes(String(target));
    return scopeMatches(target,st);
  }
  function localISO(d){
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function weekdayKo(date){return ['일','월','화','수','목','금','토'][new Date(date+'T00:00:00').getDay()]}
  function teachingSlotsForDate(timetable,calendar,exceptions,target,date){
    const wd=weekdayKo(date);
    let slots=arr(timetable).filter(s=>s.day===wd&&slotMatchesTarget(s,target)).map(s=>({...s}));
    if(arr(calendar).some(ev=>ev.date===date&&eventBlocksTarget(ev,target))) slots=[];
    const exs=arr(exceptions).filter(ex=>ex.date===date&&scopeMatches(ex.target||'전체',target));
    exs.forEach(ex=>{
      const p=Number(ex.period)||0;
      if(ex.action==='cancel'){
        slots=slots.filter(s=>p?Number(s.period)!==p:false);
      }else if(ex.action==='replace'){
        if(p)slots=slots.filter(s=>Number(s.period)!==p);
        slots.push({day:wd,period:p||99,target:normalizeScope(ex.target),label:ex.label||'대체 수업',exception:true});
      }else if(ex.action==='add'){
        slots.push({day:wd,period:p||99,target:normalizeScope(ex.target),label:ex.label||'추가 수업',exception:true});
      }
    });
    return slots;
  }
  function countClassTeachingSlots(timetable,calendar,exceptions,target,startDate,dueDate){
    if(!dueDate)return 0;
    const start=new Date((startDate||localISO(new Date()))+'T00:00:00'), end=new Date(dueDate+'T00:00:00');
    if(end<start)return 0;
    let count=0;
    for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
      count+=teachingSlotsForDate(timetable,calendar,exceptions,target,localISO(d)).length;
    }
    return count;
  }
  function classTargets(timetable){
    const set=new Set();
    arr(timetable).forEach(s=>{const t=slotTarget(s);if(/^[1-3]-\d{1,2}$/.test(t))set.add(t)});
    return [...set].sort((a,b)=>{const [ag,ac]=a.split('-').map(Number),[bg,bc]=b.split('-').map(Number);return ag-bg||ac-bc});
  }
  function paceStats(progress,targets){
    const list=arr(targets).map(t=>({target:t,lesson:Number(progress?.[t]?.lesson)||0,recorded:!!progress?.[t],topic:progress?.[t]?.topic||'',note:progress?.[t]?.note||''}));
    const byGrade={};
    list.forEach(x=>{const g=gradeFromTarget(x.target);if(!byGrade[g])byGrade[g]=[];if(x.recorded)byGrade[g].push(x.lesson)});
    const avgs={};Object.entries(byGrade).forEach(([g,vals])=>{avgs[g]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null});
    return list.map(x=>({...x,grade:gradeFromTarget(x.target),average:avgs[gradeFromTarget(x.target)],gap:avgs[gradeFromTarget(x.target)]==null?null:x.lesson-avgs[gradeFromTarget(x.target)]}));
  }
  function defaultPaceStrategy(level,grade){
    if(level==='중학교'&&String(grade)==='3')return'조기완료';
    if(level==='중학교'&&String(grade)==='2')return'여유진행';
    return'표준';
  }
  function patchBase(b){
    if(!b)return;
    const oldExtract=b.extractTarget;
    b.extractTarget=function(line){return targetFromLabel(line)||(oldExtract?oldExtract(line):'')};
    const oldParse=b.parseTimetableGrid;
    if(oldParse)b.parseTimetableGrid=function(rows,subject){
      return oldParse(rows,subject).map(x=>({...x,target:x.target||targetFromLabel(x.label)}));
    };
  }
  return {WEEKDAYS,HARD_NO_CLASS_RE,PARTIAL_RE,arr,gradeFromTarget,targetFromLabel,normalizeScope,scopeMatches,inferImpact,eventBlocksTarget,eventNeedsReview,slotTarget,slotMatchesTarget,teachingSlotsForDate,countClassTeachingSlots,classTargets,paceStats,defaultPaceStrategy,patchBase};
});
