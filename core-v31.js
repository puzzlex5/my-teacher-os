(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TeacherOSRetentionPolicy=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const LEVELS={
    transient:{id:'transient',label:'원본 미보관',description:'분석 후 원본을 놓고 최소 처리·버전 이력만 유지'},
    reference:{id:'reference',label:'출처·버전 보관',description:'원본은 놓고 출처 위치·해시·문서계열·버전관계를 유지'},
    local:{id:'local',label:'이 기기에 원본 보관',description:'원본 Blob을 이 브라우저 IndexedDB에만 보관'}
  };
  const IMPORTANT_CLASSES=new Set(['calendar','timetable','live','assessment','admin','club','schoolplan']);
  function validLevel(v){return Object.prototype.hasOwnProperty.call(LEVELS,String(v||''))?String(v):'transient'}
  function defaultLevel(docClass){return IMPORTANT_CLASSES.has(String(docClass||''))?'reference':'transient'}
  function resolveLevel(requested,docClass){const r=String(requested||'auto');return r==='auto'?defaultLevel(docClass):validLevel(r)}
  function levelInfo(level){return LEVELS[validLevel(level)]}
  function formatBytes(n){const x=Math.max(0,Number(n)||0);if(x<1024)return`${Math.round(x)} B`;if(x<1024**2)return`${(x/1024).toFixed(x<10240?1:0)} KB`;if(x<1024**3)return`${(x/1024**2).toFixed(x<10*1024**2?1:0)} MB`;return`${(x/1024**3).toFixed(2)} GB`}
  function canStoreOriginal(fileSize,estimate,reserveBytes=10*1024*1024){const size=Math.max(0,Number(fileSize)||0),quota=Number(estimate?.quota)||0,usage=Number(estimate?.usage)||0;if(!size)return{ok:false,reason:'empty-file',available:Math.max(0,quota-usage)};if(!quota)return{ok:true,reason:'quota-unknown',available:null};const available=Math.max(0,quota-usage-reserveBytes);return size<=available?{ok:true,reason:'enough-space',available}:{ok:false,reason:'insufficient-space',available}}
  function retentionRecord(level,extra={}){const l=validLevel(level);return{retentionLevel:l,retentionLabel:LEVELS[l].label,sourceLocation:l==='transient'?'':String(extra.sourceLocation||'').trim(),originalStored:l==='local'&&extra.originalStored===true,vaultKey:l==='local'&&extra.originalStored===true?String(extra.vaultKey||''):'',retentionUpdatedAt:extra.retentionUpdatedAt||new Date().toISOString()}}
  return{LEVELS,IMPORTANT_CLASSES,validLevel,defaultLevel,resolveLevel,levelInfo,formatBytes,canStoreOriginal,retentionRecord};
});