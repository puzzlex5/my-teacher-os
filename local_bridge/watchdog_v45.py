#!/usr/bin/env python3
"""Teacher OS Desktop Bridge local watchdog, upgraded for privacy shield v0.46.

Keeps the loopback Bridge alive without admin rights. It never reads source documents,
credentials, or the pairing token; it only checks the public loopback health endpoint
and starts bridge_v46.py when needed.
"""
from __future__ import annotations

import ctypes
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

HOST = "127.0.0.1"
PORT = 43135
HEALTH_URL = f"http://{HOST}:{PORT}/v1/health"
ALLOWED_ORIGIN = "https://puzzlex5.github.io"
APP_DIR = Path.home() / ".teacher-os"
LOG_FILE = APP_DIR / "watchdog-v45.jsonl"
BRIDGE = Path(__file__).with_name("bridge_v46.py")
HEALTH_INTERVAL = 20
START_WAIT_SECONDS = 15
MAX_BACKOFF_SECONDS = 300
MIN_BRIDGE_MAJOR = 46
_MUTEX_HANDLE = None


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def next_delay(failures: int) -> int:
    n = max(0, int(failures))
    return min(MAX_BACKOFF_SECONDS, 5 * (2 ** min(n, 6)))


def health_payload_ok(payload: object, min_major: int = MIN_BRIDGE_MAJOR) -> bool:
    if not isinstance(payload, dict) or payload.get("ok") is not True:
        return False
    try:
        major = int(str(payload.get("version") or "0").split(".")[0])
    except Exception:
        return False
    return major >= min_major


def bridge_healthy(timeout: float = 2.0) -> bool:
    req = urllib.request.Request(HEALTH_URL, headers={"Origin": ALLOWED_ORIGIN, "Cache-Control": "no-store"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            payload = json.loads(r.read(4096).decode("utf-8"))
        return health_payload_ok(payload)
    except Exception:
        return False


def log(event: str, **details) -> None:
    APP_DIR.mkdir(parents=True, exist_ok=True)
    safe = {k: v for k, v in details.items() if k not in {"token", "nonce", "password", "secret"}}
    row = json.dumps({"at": now_iso(), "event": event, "details": safe}, ensure_ascii=False)
    try:
        if LOG_FILE.exists() and LOG_FILE.stat().st_size > 256_000:
            backup = LOG_FILE.with_suffix(".jsonl.1")
            try:
                backup.unlink(missing_ok=True)
            except TypeError:
                if backup.exists():
                    backup.unlink()
            LOG_FILE.replace(backup)
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(row + "\n")
    except Exception:
        pass


def acquire_single_instance() -> bool:
    global _MUTEX_HANDLE
    if os.name != "nt":
        return True
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.CreateMutexW(None, False, "Local\\TeacherOSBridgeWatchdogV45")
    if not handle:
        return False
    already_exists = kernel32.GetLastError() == 183
    if already_exists:
        kernel32.CloseHandle(handle)
        return False
    _MUTEX_HANDLE = handle
    return True


def launch_bridge() -> subprocess.Popen:
    if not BRIDGE.exists():
        raise FileNotFoundError(str(BRIDGE))
    flags = 0
    if os.name == "nt":
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    return subprocess.Popen(
        [sys.executable, str(BRIDGE)],
        cwd=str(BRIDGE.parent),
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=flags,
    )


def wait_for_health(seconds: int = START_WAIT_SECONDS) -> bool:
    deadline = time.monotonic() + max(1, seconds)
    while time.monotonic() < deadline:
        if bridge_healthy():
            return True
        time.sleep(0.5)
    return False


def main() -> int:
    if not acquire_single_instance():
        return 0
    APP_DIR.mkdir(parents=True, exist_ok=True)
    failures = 0
    child = None
    log("watchdog_start", version="46.0", minimumBridge=MIN_BRIDGE_MAJOR)
    while True:
        try:
            if bridge_healthy():
                failures = 0
                time.sleep(HEALTH_INTERVAL)
                continue
            if child is not None and child.poll() is None:
                if wait_for_health(4):
                    failures = 0
                    continue
                try:
                    child.terminate()
                    child.wait(timeout=5)
                except Exception:
                    try:
                        child.kill()
                    except Exception:
                        pass
            log("bridge_restart_attempt", failureCount=failures + 1)
            child = launch_bridge()
            if wait_for_health():
                log("bridge_recovered", failureCount=failures + 1)
                failures = 0
                time.sleep(HEALTH_INTERVAL)
                continue
            failures += 1
            log("bridge_restart_failed", failureCount=failures)
            time.sleep(next_delay(failures))
        except KeyboardInterrupt:
            log("watchdog_stop", reason="keyboard_interrupt")
            return 0
        except Exception as e:
            failures += 1
            log("watchdog_error", failureCount=failures, error=type(e).__name__)
            time.sleep(next_delay(failures))


if __name__ == "__main__":
    raise SystemExit(main())
