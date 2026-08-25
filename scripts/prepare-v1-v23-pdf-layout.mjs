import fs from 'node:fs';

const path='app-v23.js';
let src=fs.readFileSync(path,'utf8');

function replaceOnce(label,from,to){
  if(!src.includes(from)){
    if(src.includes(to))return;
    throw new Error(`v1 v23 PDF layout preparation failed (${label}): expected source pattern not found`);
  }
  src=src.replace(from,to);
}

replaceOnce(
  'preserve mapped native PDF items',
  "  function pdfLayoutText23(items){const mapped=(items||[]).map(x=>({text:String(x.str||'').trim(),left:Number(x.transform?.[4]||0),top:-Number(x.transform?.[5]||0),width:Number(x.width||0),height:Math.max(8,Math.abs(Number(x.height||x.transform?.[0]||12))),score:1})).filter(x=>x.text);return itemsText23(mapped)}",
  "  function pdfLayoutPage23(items){const mapped=(items||[]).map(x=>({text:String(x.str||'').trim(),left:Number(x.transform?.[4]||0),top:-Number(x.transform?.[5]||0),width:Number(x.width||0),height:Math.max(8,Math.abs(Number(x.height||x.transform?.[0]||12))),score:1})).filter(x=>x.text);return{text:itemsText23(mapped),items:mapped}}"
);

replaceOnce(
  'collect native and OCR layout pages',
  "    const pdfjs=await import(PDFJS);pdfjs.GlobalWorkerOptions.workerSrc=PDFWORKER;const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let parts=[],ocrPages=[],nativePages=0,ocrCount=0,ocrScores=[];\n    for(let i=1;i<=doc.numPages;i++){setStatus23(`<b>${esc23(file.name)}</b> · PDF ${i}/${doc.numPages}쪽 구조 분석 중...`);const page=await doc.getPage(i),content=await page.getTextContent(),native=pdfLayoutText23(content.items),nativeQ=D.textQuality(native);if(native.replace(/\\s/g,'').length>=70&&nativeQ>=.52){parts.push(`--- ${i}쪽 ---\\n${native}`);nativePages++}else{const canvas=await renderPDFPage23(page),ocr=await smartOCR23(canvas,`${file.name} ${i}쪽`);parts.push(`--- ${i}쪽 OCR ---\\n${ocr.text}`);ocrPages.push({page:i,...ocr});ocrScores.push(ocr.confidence);ocrCount++}}\n    const method=ocrCount===0?'pdf-native-layout':nativePages===0?'pdf-ocr':'pdf-hybrid-layout+ocr',ocrConfidence=ocrScores.length?ocrScores.reduce((a,b)=>a+b,0)/ocrScores.length:null;return{text:parts.join('\\n'),method,ocrConfidence,ocrPages,pageCount:doc.numPages,layout:layoutSignals23(ocrPages.flatMap(x=>x.items),parts.join('\\n'))}",
  "    const pdfjs=await import(PDFJS);pdfjs.GlobalWorkerOptions.workerSrc=PDFWORKER;const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let parts=[],ocrPages=[],layoutPages=[],nativePages=0,ocrCount=0,ocrScores=[];\n    for(let i=1;i<=doc.numPages;i++){setStatus23(`<b>${esc23(file.name)}</b> · PDF ${i}/${doc.numPages}쪽 구조 분석 중...`);const page=await doc.getPage(i),content=await page.getTextContent(),nativePage=pdfLayoutPage23(content.items),native=nativePage.text,nativeQ=D.textQuality(native);if(native.replace(/\\s/g,'').length>=70&&nativeQ>=.52){parts.push(`--- ${i}쪽 ---\\n${native}`);layoutPages.push({page:i,text:native,items:nativePage.items,engine:'pdf-native'});nativePages++}else{const canvas=await renderPDFPage23(page),ocr=await smartOCR23(canvas,`${file.name} ${i}쪽`),ocrPage={page:i,...ocr};parts.push(`--- ${i}쪽 OCR ---\\n${ocr.text}`);ocrPages.push(ocrPage);layoutPages.push(ocrPage);ocrScores.push(ocr.confidence);ocrCount++}}\n    const method=ocrCount===0?'pdf-native-layout':nativePages===0?'pdf-ocr':'pdf-hybrid-layout+ocr',ocrConfidence=ocrScores.length?ocrScores.reduce((a,b)=>a+b,0)/ocrScores.length:null;return{text:parts.join('\\n'),method,ocrConfidence,ocrPages,layoutPages,pageCount:doc.numPages,layout:layoutSignals23(layoutPages.flatMap(x=>x.items),parts.join('\\n'))}"
);

replaceOnce(
  'parse timetable layout from every PDF layout page',
  "    if(extracted.ocrPages?.length&&(doc.classId==='timetable'||doc.classId==='live'||/시간표|컴시간|교시/.test(text))){extracted.ocrPages.forEach(p=>got.push(...parseTimetableLayout23(p,file.name,doc.classId==='live'?'live':'timetable',y.year)))}",
  "    const pdfLayoutPages=extracted.layoutPages?.length?extracted.layoutPages:extracted.ocrPages||[];if(pdfLayoutPages.length&&(doc.classId==='timetable'||doc.classId==='live'||/시간표|컴시간|교시/.test(text))){pdfLayoutPages.forEach(p=>got.push(...parseTimetableLayout23(p,file.name,doc.classId==='live'?'live':'timetable',y.year)))}"
);

const required=[
  'function pdfLayoutPage23(items)',
  'layoutPages=[]',
  "engine:'pdf-native'",
  'layoutPages.push(ocrPage)',
  'layoutSignals23(layoutPages.flatMap(x=>x.items)',
  'const pdfLayoutPages=extracted.layoutPages?.length?extracted.layoutPages:extracted.ocrPages||[]',
  'pdfLayoutPages.forEach(p=>got.push(...parseTimetableLayout23'
];
for(const token of required)if(!src.includes(token))throw new Error(`v1 prepared v23 PDF layout missing: ${token}`);
if(src.includes('layoutSignals23(ocrPages.flatMap(x=>x.items)'))throw new Error('v1 prepared v23 still derives PDF layout signals from OCR-only pages');
if(src.includes('extracted.ocrPages.forEach(p=>got.push(...parseTimetableLayout23'))throw new Error('v1 prepared v23 still parses timetable positions from OCR-only pages');

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v23 to preserve and parse native PDF page positions alongside OCR fallback pages.');
