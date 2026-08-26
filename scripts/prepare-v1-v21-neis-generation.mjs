import fs from 'node:fs';

const path='app-v21.js';
let src=fs.readFileSync(path,'utf8');

const LIMIT_MARKER="  const SUBJECT_NEIS_LIMIT21=1500;\n";
const VARIANT_MARKER="  const VARIANT_LABEL21={A:'A · 성장 흐름형',B:'B · 참여·과정형',C:'C · 간결 종합형'};\n";
if(!src.includes(LIMIT_MARKER)){
  if(!src.includes(VARIANT_MARKER))throw new Error('v21 variant marker not found');
  src=src.replace(VARIANT_MARKER,VARIANT_MARKER+LIMIT_MARKER);
}

const HELPER_MARKER='  function neisBytes21(text){';
if(!src.includes(HELPER_MARKER)){
  const anchor="  function punct21(v){const s=cleanFact21(v);return s?`${s}.`:''}\n";
  if(!src.includes(anchor))throw new Error('v21 punctuation helper marker not found');
  const helpers=`  function neisBytes21(text){const s=String(text||'').replace(/\\r\\n?/g,'\\n');if(globalThis.TextEncoder)return new TextEncoder().encode(s).length;let n=0;for(const ch of s){const cp=ch.codePointAt(0);n+=cp<=0x7f?1:cp<=0x7ff?2:cp<=0xffff?3:4}return n}\n  function fitNeis21(text,limit=SUBJECT_NEIS_LIMIT21){\n    const normalized=String(text||'').replace(/\\s+/g,' ').trim();if(!normalized||neisBytes21(normalized)<=limit)return normalized;\n    const parts=normalized.match(/[^.!?]+[.!?]?/g)||[normalized];let out='';\n    for(const raw of parts){const part=raw.trim();if(!part)continue;const candidate=out?out+' '+part:part;if(neisBytes21(candidate)>limit)break;out=candidate}\n    if(out)return out;let clipped='';for(const ch of normalized){const candidate=clipped+ch;if(neisBytes21(candidate)>limit)break;clipped=candidate}return clipped.trim()\n  }\n  function finalizeVariant21(text,area){const normalized=String(text||'').replace(/\\s+/g,' ').trim();return area==='subject'?fitNeis21(normalized):normalized.slice(0,1600)}\n`;
  src=src.replace(anchor,anchor+helpers);
}

const oldReturn="    return {A:a.replace(/\\s+/g,' ').trim().slice(0,1600),B:b.replace(/\\s+/g,' ').trim().slice(0,1600),C:c.replace(/\\s+/g,' ').trim().slice(0,1600)};\n";
const newReturn="    return {A:finalizeVariant21(a,area),B:finalizeVariant21(b,area),C:finalizeVariant21(c,area)};\n";
if(src.includes(oldReturn))src=src.replace(oldReturn,newReturn);
else if(!src.includes(newReturn))throw new Error('v21 variant return marker not found');

if(!src.includes(LIMIT_MARKER)||!src.includes(HELPER_MARKER)||!src.includes(newReturn))throw new Error('v21 NEIS-safe generation preparation incomplete');
fs.writeFileSync(path,src);
console.log('Prepared v21 subject draft generation to stay within the verified 1500Byte NEIS limit.');
