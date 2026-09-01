(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TeacherOSSetupHealth47=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const txt=v=>String(v??'').trim();
  function major(v){const n=parseInt(txt(v).split('.')[0],10);return Number.isFinite(n)?n:0}
  function validToken(v){return /^[A-Za-z0-9_-]{20,100}$/.test(txt(v))}
  function maskSecret(v){const s=txt(v);if(!s)return'미설정';if(s.length<8)return'설정됨';return `${s.slice(0,3)}••••${s.slice(-3)}`}
  function evaluate(input={}){
    const neis=input.neisSettings||{},desktop=input.desktopSettings||{},health=input.desktopHealth||{},google=input.googleSettings||{},googleState=input.googleState||{};
    const neisConfigured=!!txt(neis.apiKey);
    const desktopPaired=validToken(desktop.token);
    const bridgeMajor=major(health.version);
    const desktopHealthy=health.ok===true&&bridgeMajor>=46;
    const bridgeNeedsUpdate=health.ok===true&&bridgeMajor>0&&bridgeMajor<46;
    const googleConfigured=!!txt(google.gatewayUrl);
    const googleConnected=googleConfigured&&googleState.connected===true;
    let desktopStatus='설치 필요';
    if(desktopHealthy&&desktopPaired)desktopStatus='자동 연결 정상';
    else if(bridgeNeedsUpdate)desktopStatus='Bridge 업데이트 필요';
    else if(desktopPaired)desktopStatus='자동복구 확인 중';
    else if(health.ok===true)desktopStatus='자동 페어링 필요';
    const essentialReady=neisConfigured&&desktopHealthy&&desktopPaired;
    return{
      essentialReady,
      neis:{configured:neisConfigured,status:neisConfigured?'인증키 설정 완료':'인증키 필요',masked:maskSecret(neis.apiKey)},
      desktop:{paired:desktopPaired,healthy:desktopHealthy,needsUpdate:bridgeNeedsUpdate,version:txt(health.version),status:desktopStatus},
      google:{configured:googleConfigured,connected:googleConnected,status:googleConnected?'연결 정상':googleConfigured?'승인/연결 확인 중':'선택 연결'},
      headline:essentialReady?'필수 자동화 설정 완료':'자동화 설정 확인 필요',
      guidance:essentialReady?'이제 NEIS·K-에듀파인 파일은 Downloads에 내려받기만 하면 됩니다. 반복 입력이나 재업로드는 필요하지 않습니다.':!neisConfigured?'NEIS Open API 인증키 설정이 필요합니다.':!desktopPaired?'Desktop Bridge 자동 페어링이 필요합니다.':'Desktop Bridge 상태를 자동으로 다시 확인합니다.'
    }
  }
  return{major,validToken,maskSecret,evaluate};
});
