(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.TeacherOSSimpleUI48=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const PRIMARY_NAV=Object.freeze([
    {view:'dashboard',label:'오늘'},
    {view:'calendar',label:'일정'},
    {view:'timetable',label:'수업'},
    {view:'assessment',label:'평가'},
    {view:'projects',label:'업무'},
    {view:'settings',label:'시스템'}
  ]);
  const SECONDARY_NAV=Object.freeze([
    {view:'importer',label:'자료 직접 가져오기'},
    {view:'clubs',label:'동아리'},
    {view:'policy',label:'교육과정·지침'},
    {view:'documents',label:'자료함'},
    {view:'memory',label:'업무기억'}
  ]);
  const TECH_DASH_IDS=Object.freeze(['googleAutopilot34','neisOfficial35','desktopBridge36','workEntity39','supervisor41','workAgent33','autonomous40']);
  function n(v){const x=Number(v);return Number.isFinite(x)&&x>0?Math.round(x):0}
  function brief(plan){
    const p=plan&&typeof plan==='object'?plan:{},s=p.summary||{},focus=Array.isArray(p.focus)?p.focus:[];
    return{
      urgent:n(s.critical),
      week:n(s.warning),
      confirm:n(s.approvalOnly),
      auto:n(s.autoSafe),
      focus:focus.slice(0,4).map(x=>({title:String(x&&x.title||'업무 확인'),due:String(x&&x.due||''),severity:String(x&&x.severity||'')}))
    };
  }
  function readyText(input){
    const x=input||{};
    if(x.essentialReady===true)return{tone:'ok',title:'자동화 정상',detail:'필수 연결이 정상입니다. 문제가 생길 때만 알려드립니다.'};
    return{tone:'warn',title:'연결 점검 필요',detail:'문제가 있는 연결만 시스템 화면에서 확인하세요.'};
  }
  return{PRIMARY_NAV,SECONDARY_NAV,TECH_DASH_IDS,brief,readyText};
});
