#!/usr/bin/env python3
"""Teacher OS Desktop Bridge v0.37 with NEIS export adapter.

Runs on top of the v0.36 loopback/privacy boundary and replaces only local file
classification. NEIS exports are reduced to aggregate work signals; names and raw
rows are never returned to the browser.
"""
from __future__ import annotations

import threading
from http.server import ThreadingHTTPServer

import bridge as B
import neis_adapter as N

B.VERSION = "37.0"

_original_process = B.process_file


def process_file_v37(path):
    try:
        stat = path.stat()
        if stat.st_size <= 0 or stat.st_size > B.MAX_FILE_BYTES or B.already_scanned(path, stat):
            return
        digest = B.file_digest(path)
        text = B.sanitize_text(B.extract_text(path))
        neis = N.analyze(path.name, text)
        if not neis:
            return _original_process(path)
        due = B.extract_due(text, stat.st_mtime) if text else ""
        title = neis.title + (f" · {due}" if due else "")
        created = B.save_signal(path, digest, neis.category, title, due, neis.confidence, bool(text.strip()))
        B.upsert_file(path, stat, digest, "ok")
        B.audit(
            "neis_export_scan",
            "NEIS 내보내기 자료를 개인정보 없이 집계했습니다.",
            {
                "name": path.name,
                "adapter": neis.adapter,
                "kind": neis.kind,
                "issueCount": neis.issue_count,
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
        B.audit("neis_export_error", "NEIS 내보내기 자료 집계 실패", {"name": path.name, "error": str(e)[:300]})


B.process_file = process_file_v37


def main() -> int:
    B.ensure_dirs()
    print("Teacher OS Desktop Bridge v0.37 · NEIS Local Adapter")
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
