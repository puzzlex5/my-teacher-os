import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v05.js','utf8');
assert.ok(app.includes("async function decodeLegacyText05(file)"),'prepared importer must expose a local byte decoder');
assert.ok(app.includes("new TextDecoder('utf-16le',{fatal:true})"),'UTF-16LE BOM files must be decoded explicitly');
assert.ok(app.includes("new TextDecoder('utf-16be',{fatal:true})"),'UTF-16BE BOM files must be decoded explicitly');
assert.ok(app.includes("new TextDecoder('utf-8',{fatal:true})"),'UTF-8 must be attempted strictly before Korean legacy fallback');
assert.ok(app.includes("new TextDecoder('euc-kr',{fatal:true})"),'invalid UTF-8 must fall back to the browser Korean decoder');
assert.ok(app.includes('지원하지 않는 텍스트 인코딩입니다.'),'unknown encodings must fail visibly instead of continuing with mojibake');
assert.ok(!app.includes("return new TextDecoder('utf-8').decode(bytes)"),'lossy UTF-8 replacement decoding must not silently feed classification');
assert.ok(app.includes("if(ext==='ics')return await file.text();if(['txt','csv'].includes(ext))return await decodeLegacyText05(file);"),'TXT/CSV use Korean fallback while ICS stays standards-first UTF-8 text');
assert.ok(app.includes("ext==='csv'?await decodeLegacyText05(file):await file.arrayBuffer()"),'CSV table parsing must use the same decoded text as document classification');

const cp949=Uint8Array.from([199,208,187,231,192,207,193,164,44,50,48,50,54,45,48,51,45,48,50,44,176,179,199,208,10]);
let utf8Failed=false;
try{new TextDecoder('utf-8',{fatal:true}).decode(cp949)}catch{utf8Failed=true}
assert.equal(utf8Failed,true,'synthetic Korean fixture must be invalid UTF-8 so the fallback path is exercised');
const decoded=new TextDecoder('euc-kr',{fatal:true}).decode(cp949);
assert.equal(decoded,'학사일정,2026-03-02,개학\n','CP949 school-style CSV must decode to intact Korean text');

const utf16Text='학사일정,2026-03-02,개학\n';
const utf16le=Buffer.concat([Buffer.from([0xff,0xfe]),Buffer.from(utf16Text,'utf16le')]);
assert.equal(new TextDecoder('utf-16le',{fatal:true}).decode(utf16le.subarray(2)),utf16Text,'BOM-marked UTF-16LE school text must decode intact');

const invalid=Uint8Array.from([0xff,0xff]);
assert.throws(()=>new TextDecoder('utf-8',{fatal:true}).decode(invalid));
assert.throws(()=>new TextDecoder('euc-kr',{fatal:true}).decode(invalid));

console.log('v1 Korean TXT/CSV encoding fallback checks passed.');
