import fs from 'node:fs';

const path='app-v23.js';
let src=fs.readFileSync(path,'utf8');

const old=`  async function getPaddle23(){
    if(paddlePromise23)return paddlePromise23;
    paddlePromise23=(async()=>{const mod=await import(PADDLE_MODULE);if(!mod?.PaddleOCR?.create)throw new Error('PaddleOCR 브라우저 모듈을 불러오지 못했습니다.');return mod.PaddleOCR.create({lang:'korean',ocrVersion:'PP-OCRv5',ortOptions:{backend:'wasm'}})})();
    return paddlePromise23;
  }`;

const next=`  async function getPaddle23(){
    if(paddlePromise23)return paddlePromise23;
    const pending=(async()=>{const mod=await import(PADDLE_MODULE);if(!mod?.PaddleOCR?.create)throw new Error('PaddleOCR 브라우저 모듈을 불러오지 못했습니다.');return mod.PaddleOCR.create({lang:'korean',ocrVersion:'PP-OCRv5',ortOptions:{backend:'wasm'}})})();
    paddlePromise23=pending.catch(err=>{paddlePromise23=null;throw err});
    return paddlePromise23;
  }`;

if(src.includes(old)) src=src.replace(old,next);
else if(!src.includes('paddlePromise23=pending.catch(err=>{paddlePromise23=null;throw err})')) throw new Error('v1 v23 OCR recovery preparation failed: expected getPaddle23 source not found');

for(const token of [
  'const pending=(async()=>',
  'paddlePromise23=pending.catch(err=>{paddlePromise23=null;throw err})'
]) if(!src.includes(token)) throw new Error(`v1 prepared v23 OCR recovery missing: ${token}`);

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v23 so a transient PaddleOCR initialization failure clears the cached rejection and can retry on the next OCR request.');
