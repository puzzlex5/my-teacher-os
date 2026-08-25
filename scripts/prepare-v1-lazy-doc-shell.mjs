import fs from 'node:fs';

const file='app-v05.html';
let source=fs.readFileSync(file,'utf8');
const eager=`<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>`;
if(!source.includes(eager))throw new Error('v1 eager document dependency block missing');
if(source.includes('v1-dependency-loader.js'))throw new Error('v1 dependency loader already injected');
source=source.replace(eager,'<script src="v1-dependency-loader.js"></script>');
fs.writeFileSync(file,source);
console.log('Prepared v1 shell with lazy document dependencies');
