import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v23.js','utf8');

assert.ok(app.includes('const pending=(async()=>'),'v23 must isolate the current PaddleOCR initialization attempt');
assert.ok(app.includes('paddlePromise23=pending.catch(err=>'),'v23 must observe PaddleOCR initialization rejection');
assert.ok(app.includes('paddlePromise23=null;throw err'),'failed PaddleOCR initialization must clear the cached promise before rethrowing');
assert.ok(!app.includes("paddlePromise23=(async()=>{const mod=await import(PADDLE_MODULE)"),'v23 must not permanently cache a rejected initialization promise');
assert.ok(app.includes("try{p=await paddleRecognize23(input)}catch(e){console.warn('PaddleOCR fallback:',e)}"),'Tesseract fallback must remain available for the failed attempt');

// Behavioral regression: a rejected startup attempt must not poison the next OCR request.
let paddlePromise23=null;
let loadAttempts=0;
let createAttempts=0;
const fakeInstance={predict:async()=>[{items:[]}]};
async function loadModule(){
  loadAttempts++;
  if(loadAttempts===1)throw new Error('synthetic transient module failure');
  return{PaddleOCR:{create:async()=>{createAttempts++;return fakeInstance}}};
}
async function getPaddleBehavior(){
  if(paddlePromise23)return paddlePromise23;
  const pending=(async()=>{const mod=await loadModule();if(!mod?.PaddleOCR?.create)throw new Error('PaddleOCR browser module unavailable');return mod.PaddleOCR.create({lang:'korean',ocrVersion:'PP-OCRv5',ortOptions:{backend:'wasm'}})})();
  paddlePromise23=pending.catch(err=>{paddlePromise23=null;throw err});
  return paddlePromise23;
}

await assert.rejects(()=>getPaddleBehavior(),/synthetic transient module failure/);
assert.equal(paddlePromise23,null,'rejected startup must clear the cached promise');
assert.equal(loadAttempts,1,'first request should attempt one module load');

const recovered=await getPaddleBehavior();
assert.equal(recovered,fakeInstance,'second request must recover with a fresh OCR instance');
assert.equal(loadAttempts,2,'second request must retry module loading after the transient failure');
assert.equal(createAttempts,1,'OCR instance should be created once after recovery');

const reused=await getPaddleBehavior();
assert.equal(reused,fakeInstance,'successful initialization must still be cached');
assert.equal(loadAttempts,2,'successful cache reuse must not reload the module');
assert.equal(createAttempts,1,'successful cache reuse must not recreate the OCR instance');

console.log('v1 v23 OCR recovery tests passed: transient startup failure retries on the next request, then successful initialization is reused.');
