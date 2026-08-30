#!/usr/bin/env python3
"""Teacher OS Desktop Bridge v0.44: v0.38 adapters + one-time zero-copy pairing."""
from __future__ import annotations

import json
import threading
import urllib.parse
from http.server import ThreadingHTTPServer

import bridge as B
import bridge_v38 as V38  # noqa: F401 - installs NEIS/K-에듀파인 processing on B
import pairing_v44 as P

B.VERSION = "44.0"
B.Handler.server_version = "TeacherOSBridge/44"
_PREVIOUS_POST = B.Handler.do_POST


def _read_json_body(handler) -> dict:
    try:
        length = min(4096, max(0, int(handler.headers.get("Content-Length", "0") or 0)))
        raw = handler.rfile.read(length) if length else b"{}"
        data = json.loads(raw.decode("utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def do_POST_v44(self) -> None:
    parsed = urllib.parse.urlparse(self.path)
    if parsed.path == "/v1/pair":
        if not self._origin_ok():
            self._json({"ok": False, "error": "origin_not_allowed"}, 403)
            return
        body = _read_json_body(self)
        token = P.exchange(B.CONFIG_FILE, str(body.get("nonce") or ""))
        if not token:
            B.audit("pair_rejected", "만료되었거나 잘못된 일회용 페어링 요청을 차단했습니다.")
            self._json({"ok": False, "error": "pairing_invalid_or_expired"}, 403)
            return
        B.audit("pair_success", "일회용 페어링을 완료했습니다. 장기 토큰은 URL이나 로그에 남기지 않았습니다.")
        self._json({"ok": True, "token": token, "version": B.VERSION})
        return
    return _PREVIOUS_POST(self)


B.Handler.do_POST = do_POST_v44


def main() -> int:
    B.ensure_dirs()
    print("Teacher OS Desktop Bridge v0.44 · Zero-copy Pairing")
    print(f"Local API: http://{B.HOST}:{B.PORT}")
    print("장기 pairing token은 콘솔에 출력하지 않습니다.")
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
