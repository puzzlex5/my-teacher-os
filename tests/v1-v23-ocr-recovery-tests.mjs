import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v23.js','utf8');

assert.ok(app.includes('const pending=(async()=>'),'v23 must isolate the current PaddleOCR initialization attempt');
assert.ok(app.includes('paddlePromise23=pending.catch(err=>'),'v23 must observe PaddleOCR initialization rejection');
assert.ok(app.includes('paddlePromise23=null;throw err'),'failed PaddleOCR initialization must clear the cached promise before rethrowing');
assert.ok(!app.includes("paddlePromise23=(async()=>{const mod=await import(PADDLE_MODULE)"),'v23 must not permanently cache a rejected initialization promise');
assert.ok(app.includes("try{p=await paddleRecognize23(input)}catch(e){console.warn('PaddleOCR fallback:',e)}"),'Tesseract fallback must remain available for the failed attempt');

console.log('v1 v23 OCR initialization recovery guard passed: transient PaddleOCR startup failures are retryable without weakening fallback behavior.');
