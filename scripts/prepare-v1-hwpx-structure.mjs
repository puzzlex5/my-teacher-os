import fs from 'node:fs';
import {hwpxXmlToText} from './v1-hwpx-structure-core.mjs';

const path='app-v05.js';
let src=fs.readFileSync(path,'utf8');
const old="if(ext==='hwpx'){const zip=await JSZip.loadAsync(await file.arrayBuffer());const names=Object.keys(zip.files).filter(n=>/Contents\\/section\\d+\\.xml$/i.test(n));let s='';for(const n of names)s+='\\n'+(await zip.file(n).async('text')).replace(/<[^>]+>/g,' ');return s}";
const fn=hwpxXmlToText.toString();
const helper=`const hwpxXmlToText=${fn};\n`;
const replacement="if(ext==='hwpx'){const zip=await JSZip.loadAsync(await file.arrayBuffer());const names=Object.keys(zip.files).filter(n=>/Contents\\/section\\d+\\.xml$/i.test(n)).sort((a,b)=>Number((a.match(/section(\\d+)/i)||[])[1])-Number((b.match(/section(\\d+)/i)||[])[1]));let s='';for(const n of names)s+='\\n'+hwpxXmlToText(await zip.file(n).async('text'));return s.trim()}";

if(!src.includes('const hwpxXmlToText=function hwpxXmlToText')){
  const marker='async function readTextFile(file){';
  if(!src.includes(marker))throw new Error('v1 HWPX preparation failed: readTextFile marker missing');
  src=src.replace(marker,helper+marker);
}
if(src.includes(old))src=src.replace(old,replacement);
else if(!src.includes(replacement))throw new Error('v1 HWPX preparation failed: legacy HWPX reader pattern missing');

for(const token of ['hwpxXmlToText','colSpan','tables.push(tableText(table))','sort((a,b)=>Number((a.match(/section(\\d+)/i)','return s.trim()']){
  if(!src.includes(token))throw new Error(`v1 HWPX preparation missing: ${token}`);
}
if(src.includes("(await zip.file(n).async('text')).replace(/<[^>]+>/g,' ')"))throw new Error('v1 HWPX preparation still flattens XML structure');
fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 HWPX reader with paragraph, row, cell, and merged-column boundaries.');
