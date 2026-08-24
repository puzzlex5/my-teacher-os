import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync('app-v23.js','utf8');
for(const token of [
  'async function extractSpreadsheet23(file,y)',
  'wb.SheetNames.map',
  'sheetCount:sheets.length',
  "const sheetSets=extracted.sheets?.length?extracted.sheets",
  "sheet:sh.name||''",
  "if(['xlsx','xls','csv'].includes(ext))return extractSpreadsheet23(file,y)"
]){
  if(!app.includes(token))throw new Error(`v1 v23 multisheet guard missing: ${token}`);
}
if(app.includes('const text=await readTextFile(file),rows=await spreadsheetRows(file)')){
  throw new Error('spreadsheet intake must not read the workbook twice or restrict structure analysis to one sheet');
}

const start=app.indexOf('async function extractSpreadsheet23(file,y)');
const end=app.indexOf('  async function extractSmart23(file,y){',start);
assert.ok(start>=0&&end>start,'extractSpreadsheet23 source must be discoverable');
const fnSource=app.slice(start,end);

const workbook={
  SheetNames:['업무분장','교사시간표'],
  Sheets:{
    '업무분장':{rows:[['업무','담당'],['축제','교무'],['연수','연구'],['공문','교무']],csv:'업무,담당\n축제,교무\n연수,연구\n공문,교무'},
    '교사시간표':{rows:[['교시','월','화','수','목','금'],['1교시','2-1','','2-3','',''],['2교시','','2-2','','','2-4']],csv:'교시,월,화,수,목,금\n1교시,2-1,,2-3,,\n2교시,,2-2,,,2-4'}
  }
};
const XLSX={
  read(){return workbook},
  utils:{
    sheet_to_json(sheet){return sheet.rows},
    sheet_to_csv(sheet){return sheet.csv}
  }
};
const C={parseTimetableGrid(rows){
  if(!rows?.length||!rows[0].some(v=>String(v)==='월'))return[];
  const out=[];for(let r=1;r<rows.length;r++)for(let c=1;c<rows[r].length;c++)if(rows[r][c])out.push({day:['월','화','수','목','금'][c-1],period:r,label:String(rows[r][c]),target:String(rows[r][c])});return out;
}};
const ext23=file=>String(file.name).split('.').pop().toLowerCase();
const factory=new Function('XLSX','C','ext23',`${fnSource}; return extractSpreadsheet23;`);
const extractSpreadsheet23=factory(XLSX,C,ext23);
const fakeFile={name:'학교자료.xlsx',async arrayBuffer(){return new ArrayBuffer(8)},async text(){return''}};
const result=await extractSpreadsheet23(fakeFile,{subjects:['음악']});
assert.equal(result.sheets.length,2,'all workbook sheets must be preserved');
assert.equal(result.layout.sheetCount,2,'sheet count must describe the complete workbook');
assert.equal(result.layout.tableRows,7,'table row count must aggregate all sheets');
assert.equal(result.layout.timetableSlots,4,'timetable candidates on a smaller secondary sheet must not be lost');
assert.equal(result.rows[0][0],'교시','backward-compatible rows should prefer the sheet with timetable evidence, not merely the largest sheet');
assert.ok(result.text.includes('--- 업무분장 ---')&&result.text.includes('--- 교사시간표 ---'),'classification text must include every sheet');

console.log('v1 v23 multi-sheet single-pass spreadsheet extraction test passed');
