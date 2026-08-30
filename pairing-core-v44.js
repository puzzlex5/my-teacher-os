(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TeacherOSPairing44=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RE=/^[A-Za-z0-9_-]{32,128}$/;
  function validNonce(v){return RE.test(String(v||''))}
  function parseHash(hash){try{const p=new URLSearchParams(String(hash||'').replace(/^#/,'')),n=p.get('teacheros-pair')||'';return validNonce(n)?n:''}catch{return''}}
  function mergeDesktopSettings(raw,token){let base={endpoint:'http://127.0.0.1:43135',token:'',autoSync:true,minutes:2};try{if(typeof raw==='string'&&raw)base=Object.assign(base,JSON.parse(raw))}catch{}if(typeof token==='string')base.token=token;return base}
  return{validNonce,parseHash,mergeDesktopSettings};
});
