#!/usr/bin/env python3
"""Teacher OS Desktop Bridge v0.46: student privacy shield over v0.44 pairing."""
from __future__ import annotations

import sqlite3
import threading
from http.server import ThreadingHTTPServer

import bridge as B
import bridge_v44 as V44  # noqa: F401 - pairing + NEIS/K-에듀파인 chain
import privacy_v46 as R

B.VERSION = "46.0"
B.Handler.server_version = "TeacherOSBridge/46"
_BASE_AUDIT = B.audit
_BASE_SNAPSHOT = B.snapshot


def audit_v46(event: str, message: str, details: dict | None = None) -> None:
    _BASE_AUDIT(event, R.redact(message)[:500], R.safe_audit_details(details))


def save_signal_v46(path, digest: str, category: str, title: str, due: str, confidence: float, text_available: bool) -> bool:
    key = f"file:{digest}:{category}:{due}"
    source_name = R.safe_source_name(path.name, category)
    public_title = R.safe_title(title, category)
    try:
        with B.DB_LOCK:
            B.DB.execute(
                """INSERT INTO signals(external_key,created_at,source_name,source_ext,category,title,due_date,confidence,text_available,pii_redacted)
                VALUES(?,?,?,?,?,?,?,?,?,1)""",
                (key, B.now_iso(), source_name, path.suffix.lower(), category, public_title, due, confidence, 1 if text_available else 0),
            )
            B.DB.commit()
        return True
    except sqlite3.IntegrityError:
        return False


def snapshot_v46(cursor: int) -> dict:
    snap = _BASE_SNAPSHOT(cursor)
    for item in snap.get("items", []):
        category = str(item.get("category") or "")
        item["sourceName"] = R.safe_source_name(item.get("sourceName"), category)
        item["title"] = R.safe_title(item.get("title"), category)
        item["piiRedacted"] = True
        item["privacyVersion"] = 46
    for row in snap.get("audit", []):
        row["message"] = R.redact(row.get("message"))[:500]
        row["details"] = R.safe_audit_details(row.get("details"))
    snap["privacy"] = {"studentShield": True, "version": 46}
    return snap


B.audit = audit_v46
B.save_signal = save_signal_v46
B.snapshot = snapshot_v46


def main() -> int:
    B.ensure_dirs()
    print("Teacher OS Desktop Bridge v0.46 · Student Privacy Shield")
    print(f"Local API: http://{B.HOST}:{B.PORT}")
    print("학생 이름·학번·주민번호·연락처는 브라우저 전달 전에 최소화합니다.")
    print("장기 pairing token은 콘솔에 출력하지 않습니다.")
    worker = threading.Thread(target=B.scan_loop, name="teacher-os-scan", daemon=True)
    worker.start()
    try:
        server = ThreadingHTTPServer((B.HOST, B.PORT), B.Handler)
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    except OSError as e:
        print(f"Bridge failed to bind: {type(e).__name__}")
        return 2
    finally:
        B.STOP.set()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
