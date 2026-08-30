const assert=require('assert');
const P=require('../pairing-core-v44.js');

const nonce='A'.repeat(43);
assert.equal(P.validNonce(nonce),true);
assert.equal(P.validNonce('short'),false);
assert.equal(P.parseHash('#teacheros-pair='+nonce),nonce);
assert.equal(P.parseHash('#other=1'),'');
const s=P.mergeDesktopSettings(JSON.stringify({autoSync:false,minutes:7}), 'B'.repeat(32));
assert.equal(s.token,'B'.repeat(32));
assert.equal(s.autoSync,false);
assert.equal(s.minutes,7);
assert.equal(s.endpoint,'http://127.0.0.1:43135');
console.log('v44 pairing core tests passed');
