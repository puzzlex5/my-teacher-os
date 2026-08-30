#!/usr/bin/env python3
"""Teacher OS Desktop Bridge v0.38 with NEIS + K-에듀파인 export adapters.

The adapter chain preserves the v0.36 loopback/token/origin boundary. K-에듀파인
exports are reduced locally to aggregate work signals; raw document bodies,
approval text, names, and rows are never returned to the browser.
"""
from __future__ import annotations

import threading
from http.server import ThreadingHTTPServer

import bridge as B
import bridge_v37 as V37  # installs the NEIS-aware processor on B.process_file
import kedufine_adapter as K

PREVIOUS_PROCESS = B.process_file
B.VERSION = "38.0"
B.Handler.server_version = "TeacherOSBridge/38"


def process_file_v38(path):
    try:
        stat = path.stat()
        if stat.st_size <= 0 or stat.st_size > B.MAX_FILE_BYTES or B.already_scanned(path, stat):
            return
        digest = B.file_digest(path)
        text = B.sanitize_text(B.extract_text(path))
        edu = K.analyze(path.name, text)
        if not edu:
            return PREVIOUS_PROCESS(path)
        due = B.extract_due(text, stat.st_mtime) if text else ""
        title = edu.title + (f" · {due}" if due else "")
        created = B.save_signal(path, digest, edu.category, title, due, edu.confidence, bool(text.strip()))
        B.upsert_file(path, stat, digest, "ok")
        B.audit(
            "kedufine_export_scan",
            "K-에듀파인 내보내기 자료를 개인정보 없이 집계했습니다.",
            {
                "name": path.name,
                "adapter": edu.adapter,
                "kind": edu.kind,
                "issueCount": edu.issue_count,
                "due": due,
                "signalCreated": created,
            },
        )
    except Exception as e:
        try:
            stat = path.stat()
            B.upsert_file(path, stat, "", "error", str(e))
        except Exception:
            pass
        B.audit("kedufine_export_error", "K-에듀파인 내보내기 자료 집계 실패", {"name": path.name, "error": str(e)[:300]})


B.process_file = process_file_v38


def main() -> int:
    B.ensure_dirs()
    print("Teacher OS Desktop Bridge v0.38 · NEIS + K-에듀파인 Local Adapters")
    print(f"Local API: http://{B.HOST}:{B.PORT}")
    print(f"Pairing token: {B.CONFIG['token']}")
    print("Watch folders:")
    for d in B.CONFIG.get("watchDirs", []):
        print(" -", d)
    worker = threading.Thread(target=B.scan_loop, name="teacher-os-scan", daemon=True)
    worker.start()
    try:
        server = ThreadingHTTPServer((B.HOST, B.PORT), B.Handler)
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    except OSError as e:
        print(f"Bridge failed to bind: {e}")
        return 2
    finally:
        B.STOP.set()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
