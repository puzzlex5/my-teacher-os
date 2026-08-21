const fs=require('fs');
const src=fs.readFileSync('app-v10.js','utf8');
for(const id of ['lesson-auto-progress','assessment-countdown','calendar-impact','grade3-pace','admin-deadline','club-deadline','daily-brief']){
  if(!src.includes(id)) throw new Error('missing skill: '+id);
}
if(!src.includes('runAutoSkills')) throw new Error('auto runner missing');
if(!src.includes('addTask')) throw new Error('task action missing');
console.log('v0.10 skills tests passed');
