const assert=require('assert');
const H=require('../setup-health-core-v47.js');

assert.equal(H.major('46.0'),46);
assert.equal(H.major('bad'),0);
assert.equal(H.validToken('abcdefghijklmnopqrstuvwxyz012345'),true);
assert.equal(H.validToken('short'),false);
assert.equal(H.maskSecret('1234567890'),'123••••890');

let r=H.evaluate({
  neisSettings:{apiKey:'neis-secret-key'},
  desktopSettings:{token:'abcdefghijklmnopqrstuvwxyz012345'},
  desktopHealth:{ok:true,version:'46.0'},
  googleSettings:{gatewayUrl:''},
  googleState:{}
});
assert.equal(r.essentialReady,true);
assert.equal(r.neis.status,'인증키 설정 완료');
assert.equal(r.desktop.status,'자동 연결 정상');
assert.equal(r.google.status,'선택 연결');
assert.ok(r.guidance.includes('재업로드'));

r=H.evaluate({
  neisSettings:{apiKey:'neis-key'},
  desktopSettings:{token:'abcdefghijklmnopqrstuvwxyz012345'},
  desktopHealth:{ok:false}
});
assert.equal(r.essentialReady,false);
assert.equal(r.desktop.status,'자동복구 확인 중');

r=H.evaluate({
  neisSettings:{apiKey:'neis-key'},
  desktopSettings:{token:'abcdefghijklmnopqrstuvwxyz012345'},
  desktopHealth:{ok:true,version:'44.0'}
});
assert.equal(r.desktop.needsUpdate,true);
assert.equal(r.desktop.status,'Bridge 업데이트 필요');

r=H.evaluate({desktopHealth:{ok:true,version:'46.0'}});
assert.equal(r.neis.configured,false);
assert.equal(r.desktop.status,'자동 페어링 필요');

console.log('v47 zero-config health tests passed');
