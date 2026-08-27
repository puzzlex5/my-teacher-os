import fs from 'node:fs';

const path='app-v05.js';
let src=fs.readFileSync(path,'utf8');

if(src.includes('async function decodeLegacyText05(')){
  console.log('v1 Korean text encoding fallback already prepared.');
  process.exit(0);
}

const anchor='async function readTextFile(file){';
if(!src.includes(anchor))throw new Error('app-v05 readTextFile anchor not found');

const helper=`async function decodeLegacyText05(file){
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length>=2&&bytes[0]===0xff&&bytes[1]===0xfe)return new TextDecoder('utf-16le',{fatal:true}).decode(bytes.subarray(2));
 if(bytes.length>=2&&bytes[0]===0xfe&&bytes[1]===0xff)return new TextDecoder('utf-16be',{fatal:true}).decode(bytes.subarray(2));
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{}
 try{return new TextDecoder('euc-kr',{fatal:true}).decode(bytes)}catch{}
 throw new Error('지원하지 않는 텍스트 인코딩입니다. UTF-8, CP949/EUC-KR 또는 BOM이 있는 UTF-16 파일을 사용해 주세요.')
}
`;
src=src.replace(anchor,helper+anchor);

const oldText="if(['txt','csv','ics'].includes(ext))return await file.text();";
const newText="if(ext==='ics')return await file.text();if(['txt','csv'].includes(ext))return await decodeLegacyText05(file);";
if(!src.includes(oldText))throw new Error('app-v05 text-file decode pattern not found');
src=src.replace(oldText,newText);

const oldCsv="const data=ext==='csv'?await file.text():await file.arrayBuffer(),wb=XLSX.read(data,{type:ext==='csv'?'string':'array',cellDates:false});";
const newCsv="const data=ext==='csv'?await decodeLegacyText05(file):await file.arrayBuffer(),wb=XLSX.read(data,{type:ext==='csv'?'string':'array',cellDates:false});";
if(!src.includes(oldCsv))throw new Error('app-v05 CSV spreadsheet decode pattern not found');
src=src.replace(oldCsv,newCsv);

fs.writeFileSync(path,src);
console.log('Prepared strict UTF-8, CP949/EUC-KR, and BOM-marked UTF-16 decoding for Korean TXT/CSV intake.');
