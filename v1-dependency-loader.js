(function(root){
  const defs={
    xlsx:{global:'XLSX',src:'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'},
    mammoth:{global:'mammoth',src:'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js'},
    jszip:{global:'JSZip',src:'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'}
  };
  const pending=new Map();
  function extension(name){return String(name||'').split('.').pop().toLowerCase()}
  function requiredForFiles(files){
    const out=new Set();
    for(const file of files||[]){
      const ext=extension(file?.name);
      if(['xlsx','xls','csv'].includes(ext))out.add('xlsx');
      if(ext==='docx')out.add('mammoth');
      if(['hwpx','pptx'].includes(ext))out.add('jszip');
    }
    return [...out];
  }
  function load(name){
    const def=defs[name];
    if(!def)return Promise.reject(new Error(`알 수 없는 문서 분석 도구: ${name}`));
    if(root[def.global])return Promise.resolve(root[def.global]);
    if(pending.has(name))return pending.get(name);
    const promise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=def.src;
      script.async=true;
      script.dataset.teacherOsDependency=name;
      script.onload=()=>root[def.global]?resolve(root[def.global]):reject(new Error(`${name} 문서 분석 도구 초기화에 실패했습니다.`));
      script.onerror=()=>reject(new Error(`${name} 문서 분석 도구를 불러오지 못했습니다.`));
      document.head.appendChild(script);
    }).catch(err=>{pending.delete(name);throw err});
    pending.set(name,promise);
    return promise;
  }
  async function ensureForFiles(files){
    const names=requiredForFiles(files);
    if(!names.length)return [];
    return Promise.all(names.map(load));
  }
  root.TeacherOSDeps={requiredForFiles,ensureForFiles,load};
})(globalThis);
