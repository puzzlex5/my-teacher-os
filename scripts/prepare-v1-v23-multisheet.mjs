import fs from 'node:fs';

const path='app-v23.js';
let src=fs.readFileSync(path,'utf8');

function replaceOnce(label,from,to){
  if(!src.includes(from)){
    if(src.includes(to))return;
    throw new Error(`v1 v23 multisheet preparation failed (${label}): expected source pattern not found`);
  }
  src=src.replace(from,to);
}

const extractMarker='  async function extractSmart23(file,y){';
const spreadsheetHelper=`  async function extractSpreadsheet23(file,y){\n    const ext=ext23(file),data=ext==='csv'?await file.text():await file.arrayBuffer(),wb=XLSX.read(data,{type:ext==='csv'?'string':'array',cellDates:false}),subject=(y?.subjects||['음악'])[0]||'음악';\n    const sheets=wb.SheetNames.map(name=>{const sheet=wb.Sheets[name],rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''}),text=XLSX.utils.sheet_to_csv(sheet);return{name,rows,text,timetableSlots:C.parseTimetableGrid(rows,subject).length}}).filter(s=>s.rows.length||s.text.trim());\n    const text=sheets.map(s=>\`--- \${s.name} ---\\n\${s.text}\`).join('\\n'),tableRows=sheets.reduce((n,s)=>n+s.rows.length,0),timetableSlots=sheets.reduce((n,s)=>n+s.timetableSlots,0),best=sheets.slice().sort((a,b)=>b.timetableSlots-a.timetableSlots||b.rows.length-a.rows.length)[0];\n    return{text,method:'spreadsheet-native',ocrConfidence:null,ocrPages:[],pageCount:sheets.length||1,rows:best?.rows||[],sheets,layout:{sheetCount:sheets.length,tableRows,timetableSlots}}\n  }\n`;
if(!src.includes('async function extractSpreadsheet23(file,y)')){
  if(!src.includes(extractMarker))throw new Error('v1 v23 multisheet preparation failed: extractSmart23 marker missing');
  src=src.replace(extractMarker,spreadsheetHelper+extractMarker);
}

replaceOnce(
  'single-pass spreadsheet extraction',
  "    if(ext==='pptx')return{...(await extractPPTX23(file)),rows:[]};\n    const text=await readTextFile(file),rows=await spreadsheetRows(file),method=['xlsx','xls','csv'].includes(ext)?'spreadsheet-native':ext==='ics'?'ics-native':ext==='docx'?'docx-native':ext==='hwp'?'hwp-native':ext==='hwpx'?'hwpx-native':'native-text';\n    const tt=rows.length?C.parseTimetableGrid(rows,(y?.subjects||['음악'])[0]||'음악'):[];return{text,method,ocrConfidence:null,ocrPages:[],pageCount:1,rows,layout:{tableRows:rows.length,timetableSlots:tt.length}}",
  "    if(ext==='pptx')return{...(await extractPPTX23(file)),rows:[]};\n    if(['xlsx','xls','csv'].includes(ext))return extractSpreadsheet23(file,y);\n    const text=await readTextFile(file),method=ext==='ics'?'ics-native':ext==='docx'?'docx-native':ext==='hwp'?'hwp-native':ext==='hwpx'?'hwpx-native':'native-text';\n    return{text,method,ocrConfidence:null,ocrPages:[],pageCount:1,rows:[],layout:{}}"
);

replaceOnce(
  'all-sheet timetable candidates',
  "    const ext=ext23(file),text=extracted.text||'';let got=ext==='ics'?parseICS(text,file.name):textSuggestions(text,file.name,'auto',y.year);if(extracted.rows?.length){const tt=C.parseTimetableGrid(extracted.rows,(y.subjects||['음악'])[0]||'음악');got.push(...tt.map(x=>({id:id23(),checked:false,kind:'timetable',title:x.label,label:x.label,day:x.day,period:x.period,target:x.target,source:file.name,confidence:.97})))}",
  "    const ext=ext23(file),text=extracted.text||'';let got=ext==='ics'?parseICS(text,file.name):textSuggestions(text,file.name,'auto',y.year);const sheetSets=extracted.sheets?.length?extracted.sheets:[{name:'',rows:extracted.rows||[]}];sheetSets.forEach(sh=>{if(!sh.rows?.length)return;const tt=C.parseTimetableGrid(sh.rows,(y.subjects||['음악'])[0]||'음악');got.push(...tt.map(x=>({id:id23(),checked:false,kind:'timetable',title:x.label,label:x.label,day:x.day,period:x.period,target:x.target,source:file.name,sheet:sh.name||'',confidence:.97})))})"
);

replaceOnce(
  'preserve aggregated sheet layout',
  "const feedback=feedbackFor23(file.name),layout={...(extracted.layout||{})};if(extracted.rows?.length){layout.tableRows=extracted.rows.length;layout.timetableSlots=C.parseTimetableGrid(extracted.rows,(y.subjects||['음악'])[0]||'음악').length}",
  "const feedback=feedbackFor23(file.name),layout={...(extracted.layout||{})};if(extracted.rows?.length&&!extracted.sheets?.length){layout.tableRows=extracted.rows.length;layout.timetableSlots=C.parseTimetableGrid(extracted.rows,(y.subjects||['음악'])[0]||'음악').length}"
);

const required=[
  'extractSpreadsheet23',
  'wb.SheetNames.map',
  'sheetCount:sheets.length',
  'sheets.reduce((n,s)=>n+s.timetableSlots,0)',
  "if(['xlsx','xls','csv'].includes(ext))return extractSpreadsheet23(file,y)",
  "const sheetSets=extracted.sheets?.length?extracted.sheets",
  "sheet:sh.name||''",
  "!extracted.sheets?.length"
];
for(const token of required)if(!src.includes(token))throw new Error(`v1 prepared v23 multisheet missing: ${token}`);
if(src.includes('const text=await readTextFile(file),rows=await spreadsheetRows(file)'))throw new Error('v1 prepared v23 still double-reads spreadsheets and only analyzes one sheet');

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v23 for single-pass all-sheet spreadsheet extraction.');
