function decodeXmlEntities(value){
  return String(value||'')
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
}
function cleanText(value){
  return decodeXmlEntities(String(value||'').replace(/<[^>]+>/g,' '))
    .replace(/\r/g,'').replace(/[ \f\v]+/g,' ').replace(/ *\t */g,'\t').replace(/ *\n */g,'\n').trim();
}
function cellText(cell){
  const span=Math.max(1,Math.min(32,Number((String(cell).match(/\bcolSpan\s*=\s*["'](\d+)["']/i)||[])[1])||1));
  const body=String(cell).replace(/<\/(?:[\w.-]+:)?p\s*>/gi,' ');
  return{span,text:cleanText(body)};
}
function tableText(table){
  const rows=[];
  const rowRe=/<(?:[\w.-]+:)?tr\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?tr\s*>/gi;
  let rowMatch;
  while((rowMatch=rowRe.exec(String(table)))){
    const cols=[];
    const cellRe=/<(?:[\w.-]+:)?tc\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?tc\s*>/gi;
    let cellMatch;
    while((cellMatch=cellRe.exec(rowMatch[1]))){
      const cell=cellText(cellMatch[0]);
      cols.push(cell.text);
      for(let i=1;i<cell.span;i++)cols.push('');
    }
    if(cols.length)rows.push(cols.join('\t'));
  }
  return rows.join('\n');
}
export function hwpxXmlToText(xml){
  let source=String(xml||'');
  const tables=[];
  source=source.replace(/<(?:[\w.-]+:)?tbl\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?tbl\s*>/gi,table=>{
    const token=`__TEACHER_OS_HWPX_TABLE_${tables.length}__`;
    tables.push(tableText(table));
    return `\n${token}\n`;
  });
  source=source.replace(/<\/(?:[\w.-]+:)?p\s*>/gi,'\n');
  source=cleanText(source);
  tables.forEach((table,i)=>{source=source.replace(`__TEACHER_OS_HWPX_TABLE_${i}__`,table)});
  return source.replace(/ *\t */g,'\t').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
