(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.TeacherOSPrecisionUX=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  function chosung(v){return[...String(v||'')].map(c=>{const n=c.charCodeAt(0)-0xAC00;return n>=0&&n<=11171?CHO[Math.floor(n/588)]:c}).join('')}
  function choOnly(v){const s=String(v||'').trim();return!!s&&[...s].every(c=>CHO.includes(c)||/\s/.test(c))}
  function match(text,query){const q=String(query||'').trim().toLowerCase(),t=String(text||'').toLowerCase();if(!q)return true;if(t.includes(q))return true;return choOnly(q)&&chosung(text).toLowerCase().includes(q.replace(/\s+/g,''))}
  function neisBytes(v){const s=String(v||'');if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(s).length;if(typeof Buffer!=='undefined')return Buffer.byteLength(s,'utf8');let n=0;for(const c of s){const cp=c.codePointAt(0);n+=cp<=0x7f?1:cp<=0x7ff?2:cp<=0xffff?3:4}return n}
  const LIMITS_2026={
    behavior:{chars:300,bytes:900,label:'행동특성 및 종합의견'},
    autonomy:{chars:500,bytes:1500,label:'자율·자치활동 특기사항'},
    career:{chars:500,bytes:1500,label:'진로활동 특기사항'},
    subject:{chars:500,bytes:1500,label:'과목별 세부능력 및 특기사항'}
  };
  function limitFor(year,area){return Number(year)===2026&&LIMITS_2026[area]?{...LIMITS_2026[area],year:2026}:null}
  function byteState(text,year,area){const bytes=neisBytes(text),limit=limitFor(year,area);if(!limit)return{bytes,limit:null,over:false,ratio:null};return{bytes,limit,over:bytes>limit.bytes,ratio:limit.bytes?bytes/limit.bytes:0}}
  return{CHO,chosung,choOnly,match,neisBytes,LIMITS_2026,limitFor,byteState};
});
