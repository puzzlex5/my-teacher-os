#!/usr/bin/env python3
"""One-time pairing exchange for Teacher OS Desktop Bridge v0.44."""
from __future__ import annotations

import json
import re
import secrets
import threading
import time
from pathlib import Path

NONCE_RE = re.compile(r"^[A-Za-z0-9_-]{32,128}$")
_LOCK = threading.Lock()


def valid_nonce(value: str) -> bool:
    return bool(NONCE_RE.fullmatch(str(value or "")))


def _read(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _atomic_write(path: Path, data: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def exchange(config_path: Path, nonce: str, now: float | None = None) -> str:
    """Return the long-lived loopback token exactly once for a valid short-lived nonce."""
    if not valid_nonce(nonce):
        return ""
    with _LOCK:
        data = _read(config_path)
        saved = str(data.get("pairNonce") or "")
        expires = float(data.get("pairExpiresAt") or 0)
        current = float(time.time() if now is None else now)
        token = str(data.get("token") or "")
        if not token or expires <= current or not secrets.compare_digest(saved, nonce):
            return ""
        data.pop("pairNonce", None)
        data.pop("pairExpiresAt", None)
        data["pairedAt"] = int(current)
        _atomic_write(config_path, data)
        return token
