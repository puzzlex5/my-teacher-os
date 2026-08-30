"""Privacy-preserving heuristics for NEIS-exported files.

This module never returns names, raw rows, or document text. It reduces a local
export into an aggregate work signal that Teacher OS can act on.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, asdict

NEIS_HINTS = (
    "나이스", "neis", "학생부", "생활기록부", "성적", "수행평가", "지필평가",
    "출결", "결석", "지각", "조퇴", "진도", "교과진도", "평가계획", "성적처리",
)
ISSUE_WORDS = ("미입력", "미완료", "미처리", "누락", "오류", "확인필요", "확인 필요", "미확인")

@dataclass(frozen=True)
class NeisAggregate:
    adapter: str
    kind: str
    category: str
    title: str
    confidence: float
    issue_count: int

    def to_dict(self) -> dict:
        return asdict(self)


def looks_like_neis(name: str, text: str = "") -> bool:
    hay = f"{name}\n{text[:8000]}".lower()
    return any(h.lower() in hay for h in NEIS_HINTS)


def count_issues(text: str) -> int:
    hay = text[:100_000]
    total = 0
    for w in ISSUE_WORDS:
        total += len(re.findall(re.escape(w), hay, flags=re.I))
    return min(total, 999)


def detect_kind(name: str, text: str) -> tuple[str, str]:
    hay = f"{name}\n{text[:40_000]}".lower()
    if any(k in hay for k in ("학생부", "생활기록부", "세특", "행동특성", "창체")):
        return "student_record", "student_record"
    if any(k in hay for k in ("출결", "결석", "지각", "조퇴", "결과")):
        return "attendance", "student_record"
    if any(k in hay for k in ("수행평가", "지필평가", "성적처리", "성적", "평가계획")):
        return "assessment", "assessment"
    if any(k in hay for k in ("진도", "교과진도", "수업진도")):
        return "progress", "document"
    return "neis_document", "document"


def analyze(name: str, text: str) -> NeisAggregate | None:
    if not looks_like_neis(name, text):
        return None
    kind, category = detect_kind(name, text)
    issues = count_issues(text)
    labels = {
        "student_record": "NEIS 학생부 점검",
        "attendance": "NEIS 출결 점검",
        "assessment": "NEIS 평가·성적 점검",
        "progress": "NEIS 수업 진도 점검",
        "neis_document": "NEIS 업무자료 확인",
    }
    base = labels[kind]
    title = f"{base} · 확인 필요 {issues}건" if issues else base
    confidence = 0.94 if issues else 0.86
    return NeisAggregate(
        adapter="neis_export",
        kind=kind,
        category=category,
        title=title,
        confidence=confidence,
        issue_count=issues,
    )
