(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.TeacherOSPrivacy46=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SURNAME='김이박최정강조윤장임한오서신권황안송전홍유고문양손배백허남심노하곽성차주우구민진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용';
  const escRe=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const NAME_CTX=new RegExp(`(^|[\\s_.()\\[\\]-])([${escRe(SURNAME)}][가-힣]{1,3})(?=[\\s_.-]+(?:학생부|생활기록부|세특|행동특성|출결|성적|수행평가|지필평가)(?:$|[\\s_.()\\[\\]-]))`,'g');
  function text(v){return String(v??'')}
  function redact(v){
    let s=text(v);
    s=s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[이메일]');
    s=s.replace(/(?<!\d)(?:01\d|0\d{1,2})[-\s]?\d{3,4}[-\s]?\d{4}(?!\d)/g,'[전화번호]');
    s=s.replace(/(?<!\d)\d{6}[- ]?[1-4]\d{6}(?!\d)/g,'[주민번호]');
    s=s.replace(/(학생명|성명|학생\s*이름|이름)\s*[:：=_-]?\s*[가-힣]{2,4}/g,'$1 [이름]');
    s=s.replace(/(학번|학생번호|출석번호)\s*[:：=_-]?\s*\d{1,12}/g,'$1 [학생번호]');
    s=s.replace(NAME_CTX,'$1[학생]');
    return s;
  }
  function extOf(name){const m=text(name).match(/(\.[A-Za-z0-9]{1,8})$/);return m?m[1].toLowerCase():''}
  function safeSourceName(name,category){if(String(category||'')==='student_record')return '학생부 자료'+extOf(name);return redact(name).slice(0,180)}
  function safeTitle(title,category){const s=redact(title).trim();if(String(category||'')==='student_record'&&!s)return'학생부 점검';return s.slice(0,240)}
  function safeSummary(v){return redact(v).slice(0,500)}
  function containsRawStudentFixture(v){return /(?:김민수|이서연|박지훈|정하은|최도윤)/.test(text(v))}
  return{redact,safeSourceName,safeTitle,safeSummary,containsRawStudentFixture};
});
