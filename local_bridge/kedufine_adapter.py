"""Privacy-preserving K-에듀파인 export aggregator.

Reduces locally exported document/approval/finance files to aggregate work signals.
No document body, approval text, personal name, or raw row is returned.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, asdict

HINTS=("k-에듀파인","에듀파인","업무관리","문서함","공문","접수","결재","기안","품의","예산","지출","정산","회계")
ISSUES=("미처리","미결재","결재대기","대기","반려","보완","미접수","미완료","누락","마감")
ISSUE_RE=re.compile("|".join(re.escape(x) for x in sorted(ISSUES,key=len,reverse=True)),re.I)

@dataclass(frozen=True)
class EdufineAggregate:
    adapter:str
    kind:str
    category:str
    title:str
    confidence:float
    issue_count:int
    def to_dict(self): return asdict(self)

def looks_like_kedufine(name:str,text:str="")->bool:
    hay=f"{name}\n{text[:8000]}".lower()
    return any(x.lower() in hay for x in HINTS)

def detect_kind(name:str,text:str)->str:
    hay=f"{name}\n{text[:40000]}".lower()
    if any(x in hay for x in ("결재","기안","검토","협조","전결")): return "approval"
    if any(x in hay for x in ("예산","지출","품의","정산","회계","원인행위")): return "finance"
    if any(x in hay for x in ("문서함","공문","접수","시행","배부")): return "document_box"
    return "admin_document"

def count_issues(text:str)->int:
    return min(999,len(ISSUE_RE.findall(text[:100000])))

def analyze(name:str,text:str):
    if not looks_like_kedufine(name,text): return None
    kind=detect_kind(name,text); issues=count_issues(text)
    labels={"approval":"K-에듀파인 결재 점검","finance":"K-에듀파인 예산·지출 점검","document_box":"K-에듀파인 공문함 점검","admin_document":"K-에듀파인 행정업무 점검"}
    base=labels[kind]; title=f"{base} · 확인 필요 {issues}건" if issues else base
    return EdufineAggregate("kedufine_export",kind,"admin",title,0.95 if issues else 0.87,issues)
