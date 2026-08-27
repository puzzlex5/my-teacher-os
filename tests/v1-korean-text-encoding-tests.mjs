import assert from 'node:assert';
import fs from 'node:fs';

const app=fs.readFileSync('app-v05.js','utf8');
assert.ok(app.includes("async function decodeLegacyText05(file)"),'prepared importer must expose a local byte decoder');
assert.ok(app.includes("new TextDecoder('utf-8',{fatal:true})"),'UTF-8 must be attempted strictly first');
assert.ok(app.includes("new TextDecoder('euc-kr',{fatal:true})"),'invalid UTF-8 must fall back to the browser Korean decoder');
assert.ok(app.includes("if(ext==='ics')return await file.text();if(['txt','csv'].includes(ext))return await decodeLegacyText05(file);"),'TXT/CSV use Korean fallback while ICS stays standards-first UTF-8 text');
assert.ok(app.includes("ext==='csv'?await decodeLegacyText05(file):await file.arrayBuffer()"),'CSV table parsing must use the same decoded text as document classification');

const cp949=Uint8Array.from([199,208,187,231,192,207,193,164,44,50,48,50,54,45,48,51,45,48,50,44,176,179,199,208,10]);
let utf8Failed=false;
try{new TextDecoder('utf-8',{fatal:true}).decode(cp949)}catch{utf8Failed=true}
assert.equal(utf8Failed,true,'synthetic Korean fixture must be invalid UTF-8 so the fallback path is exercised');
const decoded=new TextDecoder('euc-kr',{fatal:true}).decode(cp949);
assert.equal(decoded,'학사일정,2026-03-02,개학\n','CP949 school-style CSV must decode to intact Korean text');

console.log('v1 Korean TXT/CSV encoding fallback checks passed.');
