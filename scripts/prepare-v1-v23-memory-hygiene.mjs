import fs from 'node:fs';

const path='app-v23.js';
let src=fs.readFileSync(path,'utf8');

const rawReport='report.method=extracted.method;report.extracted=extracted;const privacy=';
const summaryReport='report.method=extracted.method;report.pageCount=Number(extracted.pageCount||0);const privacy=';
if(src.includes(rawReport))src=src.replace(rawReport,summaryReport);
else if(!src.includes(summaryReport))throw new Error('v1 v23 memory hygiene preparation failed: extraction-report pattern not found');

const duplicateSuggestions='report.reviewCount=got.length-report.autoCount;report.suggestions=got;suggestions=';
const singleSuggestions='report.reviewCount=got.length-report.autoCount;suggestions=';
if(src.includes(duplicateSuggestions))src=src.replace(duplicateSuggestions,singleSuggestions);
else if(!src.includes(singleSuggestions))throw new Error('v1 v23 memory hygiene preparation failed: suggestion-report pattern not found');

if(src.includes('report.extracted='))throw new Error('v1 prepared v23 still retains full extracted document data in batch reports');
if(src.includes('report.suggestions='))throw new Error('v1 prepared v23 still duplicates suggestion details in batch reports');
for(const token of [
  'report.pageCount=Number(extracted.pageCount||0)',
  'const extracted=await extractSmart23(file,y)',
  'sourceSuggestions23(extracted,file,y,doc,batchId)',
  'suggestions=C.dedupe('
]){
  if(!src.includes(token))throw new Error(`v1 prepared v23 memory hygiene missing: ${token}`);
}

fs.writeFileSync(path,src,'utf8');
console.log('Prepared v1 app-v23 to retain only non-sensitive extraction summaries in batch reports.');
