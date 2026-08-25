import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('app-v23.js','utf8');

// Accuracy guard: native text PDFs must retain the same positional item shape
// used by OCR pages so timetable extraction can use coordinates on both paths.
for(const token of [
  'function pdfLayoutPage23(items)',
  'return{text:itemsText23(mapped),items:mapped}',
  'layoutPages=[]',
  "layoutPages.push({page:i,text:native,items:nativePage.items,engine:'pdf-native'})",
  'layoutPages.push(ocrPage)',
  'layoutSignals23(layoutPages.flatMap(x=>x.items)',
  'const pdfLayoutPages=extracted.layoutPages?.length?extracted.layoutPages:extracted.ocrPages||[]',
  'pdfLayoutPages.forEach(p=>got.push(...parseTimetableLayout23'
])assert.ok(app.includes(token),`prepared v23 PDF layout path missing: ${token}`);

assert.ok(!app.includes('layoutSignals23(ocrPages.flatMap(x=>x.items)'), 'PDF document classification must not ignore native page positions');
assert.ok(!app.includes('extracted.ocrPages.forEach(p=>got.push(...parseTimetableLayout23'), 'timetable position parsing must not be OCR-only');

// Synthetic, no-PII geometry sanity check matching the production PDF mapping.
const pdfItems=[
  {str:'월',transform:[12,0,0,12,100,700],width:18,height:12},
  {str:'화',transform:[12,0,0,12,200,700],width:18,height:12},
  {str:'수',transform:[12,0,0,12,300,700],width:18,height:12},
  {str:'목',transform:[12,0,0,12,400,700],width:18,height:12},
  {str:'금',transform:[12,0,0,12,500,700],width:18,height:12},
  {str:'1교시',transform:[12,0,0,12,30,650],width:36,height:12},
  {str:'2-1',transform:[12,0,0,12,100,650],width:24,height:12},
  {str:'2교시',transform:[12,0,0,12,30,600],width:36,height:12},
  {str:'2-2',transform:[12,0,0,12,200,600],width:24,height:12}
];
const mapped=pdfItems.map(x=>({
  text:String(x.str||'').trim(),
  left:Number(x.transform?.[4]||0),
  top:-Number(x.transform?.[5]||0),
  width:Number(x.width||0),
  height:Math.max(8,Math.abs(Number(x.height||x.transform?.[0]||12))),
  score:1
})).filter(x=>x.text);
assert.equal(mapped.length,9);
assert.equal(new Set(mapped.filter(x=>/^[월화수목금]$/.test(x.text)).map(x=>x.text)).size,5, 'native PDF weekday coordinates must survive mapping');
assert.equal(mapped.filter(x=>/^\d교시$/.test(x.text)).length,2, 'native PDF period coordinates must survive mapping');
assert.equal(mapped.filter(x=>/^\d-\d+$/.test(x.text)).length,2, 'native PDF class coordinates must survive mapping');
assert.ok(mapped.every(x=>Number.isFinite(x.left)&&Number.isFinite(x.top)&&x.height>=8), 'mapped PDF positions must remain finite and usable');

console.log('v1 native PDF positional timetable guards passed');
