(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TeacherOSLessonAudio=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MUSIC=['리듬','박자','드럼','스트로크','합주','가창','감상','창작','악기','코드','화음','템포','음정','멜로디','선율','표현','셈여림','리코더','기타','베이스','건반','노래','연주','악보','쉼표','음표','장단','국악','오케스트라','밴드','즉흥','반주','음악'];
  function sanitize(text){return String(text||'').replace(/\b\d{6}-?[1-4]\d{6}\b/g,'[개인정보]').replace(/\b01[016789][- .]?\d{3,4}[- .]?\d{4}\b/g,'[연락처]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig,'[이메일]').replace(/\s+/g,' ').trim()}
  function keywordCandidates(extra=[]){return [...new Set([...MUSIC,...extra.flatMap(x=>String(x||'').match(/[가-힣A-Za-z]{2,}/g)||[]).filter(x=>x.length<=12)])]}
  function extractKeywords(text,extra=[]){const s=sanitize(text),freq=[];keywordCandidates(extra).forEach(k=>{const n=s.split(k).length-1;if(n>0)freq.push([k,n])});return freq.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,7).map(x=>x[0])}
  function analyze(text,extra=[]){const clean=sanitize(text),keywords=extractKeywords(clean,extra),len=clean.length;let confidence='low';if(len>=220&&keywords.length>=3)confidence='high';else if(len>=90&&keywords.length>=2)confidence='medium';const summary=keywords.length?`주요 내용: ${keywords.slice(0,5).join(' · ')}`:(clean?`수업 발화 ${len}자 분석 · 주제 자동판단 불확실`:'분석할 수업 발화가 없습니다.');return{clean,keywords,summary,confidence,autoAdvance:confidence!=='low'}}
  return{sanitize,extractKeywords,analyze,MUSIC};
});
