import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const SCHOOL_CODE=Number(process.env.COMCIGAN_SCHOOL_CODE||0);
const TEACHER_INDEX=Number(process.env.COMCIGAN_TEACHER_INDEX||0);
const SYNC_KEY=process.env.TEACHEROS_SYNC_KEY||'';
if(!SCHOOL_CODE||!TEACHER_INDEX||!SYNC_KEY){
  console.log('Comcigan sync secrets are not configured; skipping.');
  process.exit(0);
}

function kstNow(){return new Date(Date.now()+9*60*60*1000)}
function isoUTC(d){return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`}
function mondayKST(){const d=kstNow(),day=d.getUTCDay();d.setUTCDate(d.getUTCDate()-((day+6)%7));return isoUTC(d)}
function addDays(date,n){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return isoUTC(d)}
function targetFromCls(cls){const n=Number(cls);if(!Number.isFinite(n)||n<101)return'';return `${Math.floor(n/100)}-${n%100}`}
function normalizeTeacherData(raw,weekStart){
  const days=['월','화','수','목','금'],slots=[];
  for(const [dayKey,periods] of Object.entries(raw||{})){
    const dayNum=Number(dayKey);if(dayNum<1||dayNum>5||!periods)continue;
    for(const [periodKey,item] of Object.entries(periods)){
      if(!item||typeof item!=='object'||!item.cls)continue;
      const period=Number(periodKey);if(!period)continue;
      const target=targetFromCls(item.cls);if(!target)continue;
      slots.push({date:addDays(weekStart,dayNum-1),day:days[dayNum-1],period,target,subject:String(item.subject||'수업'),label:`${target} ${String(item.subject||'수업')}`,changed:!!item.changed,source:'컴시간 자동동기화'});
    }
  }
  return slots.sort((a,b)=>a.date.localeCompare(b.date)||a.period-b.period||a.target.localeCompare(b.target));
}
function encryptPayload(payload,pass){
  const salt='teacher-os-comcigan-v1',iv=crypto.randomBytes(12),key=crypto.pbkdf2Sync(pass,salt,150000,32,'sha256'),cipher=crypto.createCipheriv('aes-256-gcm',key,iv),plain=Buffer.from(JSON.stringify(payload),'utf8'),enc=Buffer.concat([cipher.update(plain),cipher.final()]),tag=cipher.getAuthTag();return {version:1,alg:'AES-256-GCM/PBKDF2-SHA256',salt,iv:iv.toString('base64'),data:Buffer.concat([enc,tag]).toString('base64')};
}

const mod=await import('comcigan');
const ComciganTeacher=mod.ComciganTeacher||mod.default?.ComciganTeacher;
if(!ComciganTeacher)throw new Error('ComciganTeacher export not found');
const client=new ComciganTeacher(SCHOOL_CODE);
await client.init();
const result=await client.getTimetable();
const teacherRaw=result?.data?.[TEACHER_INDEX]||result?.data?.[String(TEACHER_INDEX)];
if(!teacherRaw)throw new Error('Configured teacher index was not found in Comcigan data');
const weekStart=mondayKST(),slots=normalizeTeacherData(teacherRaw,weekStart),payload={version:1,weekStart,fetchedAt:new Date().toISOString(),slots};
if(!slots.length)throw new Error('Comcigan returned no timetable slots for configured teacher');
const encrypted=encryptPayload(payload,SYNC_KEY),out=path.join(process.cwd(),'live','comcigan.enc.json');
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.writeFile(out,JSON.stringify(encrypted,null,2)+'\n','utf8');
console.log(`Encrypted Comcigan timetable written (${slots.length} slots).`);
