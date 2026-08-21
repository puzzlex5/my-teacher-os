const assert=require('node:assert');
function targetFromCls(v){const n=Number(v);if(!Number.isFinite(n)||n<101)return'';return `${Math.floor(n/100)}-${n%100}`}
function mondayOf(s){const d=new Date(s+'T00:00:00');const day=d.getDay();d.setDate(d.getDate()-((day+6)%7));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function parseWeekStart(text){const m=String(text).match(/(\d{2,4})[-./](\d{1,2})[-./](\d{1,2})\s*[~～-]\s*(\d{2,4})[-./](\d{1,2})[-./](\d{1,2})/);if(!m)return'';let yy=Number(m[1]);if(yy<100)yy+=2000;return mondayOf(`${yy}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`)}
assert.equal(targetFromCls(304),'3-4');
assert.equal(targetFromCls(208),'2-8');
assert.equal(targetFromCls(210),'2-10');
assert.equal(parseWeekStart('26-08-17 ~ 26-08-22'),'2026-08-17');
assert.equal(mondayOf('2026-08-21'),'2026-08-17');
console.log('v0.7 tests passed');
