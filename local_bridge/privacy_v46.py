#!/usr/bin/env python3
"""Privacy minimization helpers for Teacher OS local bridge v0.46."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
PHONE_RE = re.compile(r"(?<!\d)(?:01\d|0\d{1,2})[-\s]?\d{3,4}[-\s]?\d{4}(?!\d)")
RRN_RE = re.compile(r"(?<!\d)\d{6}[- ]?[1-4]\d{6}(?!\d)")
LABELED_NAME_RE = re.compile(r"(학생명|성명|학생\s*이름|이름)\s*[:：=_-]?\s*[가-힣]{2,4}")
STUDENT_NO_RE = re.compile(r"(학번|학생번호|출석번호)\s*[:：=_-]?\s*\d{1,12}")
SURNAME = "김이박최정강조윤장임한오서신권황안송전홍유고문양손배백허남심노하곽성차주우구민진지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모탁국어은편용"
NAME_CONTEXT_RE = re.compile(
    rf"(^|[\s_.()\[\]-])([{SURNAME}][가-힣]{{1,3}})(?=[\s_.-]+(?:학생부|생활기록부|세특|행동특성|출결|성적|수행평가|지필평가)(?:$|[\s_.()\[\]-]))"
)
WINDOWS_PATH_RE = re.compile(r"[A-Za-z]:\\[^\r\n,;]+")
POSIX_HOME_RE = re.compile(r"/(?:home|Users)/[^\s\r\n,;]+")


def redact(value: Any) -> str:
    s = str(value or "")
    s = EMAIL_RE.sub("[이메일]", s)
    s = PHONE_RE.sub("[전화번호]", s)
    s = RRN_RE.sub("[주민번호]", s)
    s = LABELED_NAME_RE.sub(lambda m: f"{m.group(1)} [이름]", s)
    s = STUDENT_NO_RE.sub(lambda m: f"{m.group(1)} [학생번호]", s)
    s = NAME_CONTEXT_RE.sub(lambda m: f"{m.group(1)}[학생]", s)
    return s


def safe_source_name(name: Any, category: str = "") -> str:
    raw = str(name or "")
    suffix = Path(raw).suffix.lower()[:10]
    if category == "student_record":
        return f"학생부 자료{suffix}"
    return redact(Path(raw).name)[:180]


def safe_title(title: Any, category: str = "") -> str:
    s = redact(title).strip()
    if category == "student_record" and not s:
        s = "학생부 점검"
    return s[:240]


def safe_error(value: Any) -> str:
    s = redact(value)
    s = WINDOWS_PATH_RE.sub("[local-path]", s)
    s = POSIX_HOME_RE.sub("[local-path]", s)
    return s[:300]


def safe_audit_details(details: Any) -> dict:
    if not isinstance(details, dict):
        return {}
    category = str(details.get("category") or "")
    out: dict[str, Any] = {}
    for key, value in details.items():
        k = str(key)
        kl = k.lower()
        if kl in {"token", "nonce", "password", "secret", "raw", "body", "text"}:
            continue
        if kl in {"path", "filepath", "file_path"}:
            out[k] = "[local-path]"
        elif kl in {"name", "filename", "source_name", "sourcename"}:
            suffix = Path(str(value or "")).suffix.lower()[:10]
            out[k] = f"로컬 문서{suffix}"
        elif kl == "error":
            out[k] = safe_error(value)
        elif isinstance(value, str):
            out[k] = redact(value)[:500]
        elif isinstance(value, (int, float, bool)) or value is None:
            out[k] = value
        elif isinstance(value, dict):
            out[k] = safe_audit_details(value)
        elif isinstance(value, list):
            out[k] = [redact(x)[:200] if isinstance(x, str) else x for x in value[:30]]
        else:
            out[k] = redact(value)[:300]
    return out
