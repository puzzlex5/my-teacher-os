import fs from 'node:fs';

const file='app-v05.html';
let source=fs.readFileSync(file,'utf8');
const eager=`<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js"></script>\n<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>`;
const dependencyLoader='<script src="v1-dependency-loader.js"></script>';
const lifecycleLoader='<script src="v1-lifecycle-service.js"></script>';
const prepared=`${dependencyLoader}\n${lifecycleLoader}`;

if(source.includes(prepared)){
  console.log('Prepared v1 shell with lazy document dependencies and shared lifecycle (already applied)');
  process.exit(0);
}
if(source.includes(dependencyLoader)){
  source=source.replace(dependencyLoader,prepared);
  fs.writeFileSync(file,source);
  console.log('Upgraded prepared v1 shell to load shared lifecycle');
  process.exit(0);
}
if(!source.includes(eager))throw new Error('v1 eager document dependency block missing');
source=source.replace(eager,prepared);
fs.writeFileSync(file,source);
console.log('Prepared v1 shell with lazy document dependencies and shared lifecycle');
