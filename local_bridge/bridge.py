#!/usr/bin/env python3
"""Teacher OS Desktop Bridge v0.36.

Local-only worker that watches selected folders, extracts low-risk task signals from
school documents, and exposes them to Teacher OS through a loopback HTTP API.

Security boundaries:
- binds to 127.0.0.1 only
- only accepts browser requests from https://puzzlex5.github.io
- snapshot/rescan endpoints require a per-device pairing token
- never uploads source files or raw document text
- stores derived signals and audit records only in the user's profile
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import secrets
import sqlite3
import sys
import threading
import time
import traceback
import urllib.parse
import zipfile
from datetime import date, datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

VERSION = "36.0"
HOST = "127.0.0.1"
PORT = 43135
ALLOWED_ORIGIN = "https://puzzlex5.github.io"
APP_DIR = Path.home() / ".teacher-os"
STATE_DB = APP_DIR / "desktop-bridge.db"
CONFIG_FILE = APP_DIR / "bridge-config.json"
INBOX_DIR = Path.home() / "Teacher OS Inbox"
DEFAULT_DOWNLOADS = Path.home() / "Downloads"
SUPPORTED = {".csv", ".txt", ".md", ".xlsx", ".hwpx", ".pdf", ".hwp"}
SCAN_SECONDS = 30
MAX_FILE_BYTES = 35 * 1024 * 1024
MAX_TEXT_CHARS = 120_000

KEYWORDS = {
    "assessment": ["수행평가", "지필평가", "평가계획", "성적", "채점", "평가"],
    "admin": ["공문", "제출", "마감", "회신", "결재", "품의", "예산", "정산", "보고"],
    "schedule": ["일정", "행사", "연수", "회의", "협의회", "출장", "방학", "재량휴업"],
    "student_record": ["학생부", "생활기록부", "세특", "행동특성", "창체"],
}
DATE_PATTERNS = [
    re.compile(r"(?P<y>20\d{2})[.\-/년\s]+(?P<m>\d{1,2})[.\-/월\s]+(?P<d>\d{1,2})"),
    re.compile(r"(?<!\d)(?P<m>\d{1,2})[.\-/월\s]+(?P<d>\d{1,2})(?:일)?(?!\d)"),
]
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
PHONE_RE = re.compile(r"(?<!\d)(?:01\d|0\d{1,2})[-\s]?\d{3,4}[-\s]?\d{4}(?!\d)")
STUDENT_ID_RE = re.compile(r"(?<!\d)\d{6}[- ]?[1-4]\d{6}(?!\d)")


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def ensure_dirs() -> None:
    APP_DIR.mkdir(parents=True, exist_ok=True)
    INBOX_DIR.mkdir(parents=True, exist_ok=True)


def default_config() -> dict:
    dirs = [str(INBOX_DIR)]
    if DEFAULT_DOWNLOADS.exists():
        dirs.append(str(DEFAULT_DOWNLOADS))
    return {
        "version": VERSION,
        "token": secrets.token_urlsafe(24),
        "watchDirs": dirs,
        "scanSeconds": SCAN_SECONDS,
        "createdAt": now_iso(),
    }


def load_config() -> dict:
    ensure_dirs()
    if CONFIG_FILE.exists():
        try:
            data = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            if data.get("token") and isinstance(data.get("watchDirs"), list):
                return data
        except Exception:
            pass
    data = default_config()
    CONFIG_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data


def init_db() -> sqlite3.Connection:
    ensure_dirs()
    db = sqlite3.connect(STATE_DB, check_same_thread=False)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute(
        """CREATE TABLE IF NOT EXISTS files (
        path TEXT PRIMARY KEY,
        mtime_ns INTEGER NOT NULL,
        size INTEGER NOT NULL,
        digest TEXT NOT NULL,
        scanned_at TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT DEFAULT ''
        )"""
    )
    db.execute(
        """CREATE TABLE IF NOT EXISTS signals (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        external_key TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        source_name TEXT NOT NULL,
        source_ext TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        due_date TEXT DEFAULT '',
        confidence REAL NOT NULL,
        text_available INTEGER NOT NULL DEFAULT 0,
        pii_redacted INTEGER NOT NULL DEFAULT 1
        )"""
    )
    db.execute(
        """CREATE TABLE IF NOT EXISTS audit (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        event TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT DEFAULT '{}'
        )"""
    )
    db.commit()
    return db


CONFIG = load_config()
DB = init_db()
DB_LOCK = threading.RLock()
STOP = threading.Event()


def audit(event: str, message: str, details: dict | None = None) -> None:
    with DB_LOCK:
        DB.execute(
            "INSERT INTO audit(at,event,message,details) VALUES(?,?,?,?)",
            (now_iso(), event, message, json.dumps(details or {}, ensure_ascii=False)),
        )
        DB.execute("DELETE FROM audit WHERE seq NOT IN (SELECT seq FROM audit ORDER BY seq DESC LIMIT 500)")
        DB.commit()


def decode_text(data: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "cp949", "euc-kr"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="ignore")


def extract_csv(data: bytes) -> str:
    text = decode_text(data)
    out: list[str] = []
    try:
        reader = csv.reader(io.StringIO(text))
        for i, row in enumerate(reader):
            if i >= 500:
                break
            out.append(" | ".join(str(x) for x in row[:40]))
    except Exception:
        return text[:MAX_TEXT_CHARS]
    return "\n".join(out)[:MAX_TEXT_CHARS]


def xlsx_shared_strings(z: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    except Exception:
        return []
    out = []
    for si in root.iter():
        if si.tag.endswith("}si"):
            parts = [n.text or "" for n in si.iter() if n.tag.endswith("}t")]
            out.append("".join(parts))
    return out


def extract_xlsx(path: Path) -> str:
    out: list[str] = []
    with zipfile.ZipFile(path) as z:
        shared = xlsx_shared_strings(z)
        names = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml"))[:12]
        for name in names:
            root = ET.fromstring(z.read(name))
            values: list[str] = []
            for cell in root.iter():
                if not cell.tag.endswith("}c"):
                    continue
                typ = cell.attrib.get("t", "")
                v = next((x for x in cell if x.tag.endswith("}v")), None)
                inline = next((x for x in cell.iter() if x.tag.endswith("}t")), None)
                value = ""
                if typ == "s" and v is not None and (v.text or "").isdigit():
                    idx = int(v.text or 0)
                    if 0 <= idx < len(shared):
                        value = shared[idx]
                elif inline is not None:
                    value = inline.text or ""
                elif v is not None:
                    value = v.text or ""
                if value:
                    values.append(value)
                    if len(values) >= 6000:
                        break
            out.append("\n".join(values))
    return "\n".join(out)[:MAX_TEXT_CHARS]


def extract_hwpx(path: Path) -> str:
    out: list[str] = []
    with zipfile.ZipFile(path) as z:
        names = sorted(n for n in z.namelist() if n.startswith("Contents/section") and n.endswith(".xml"))[:30]
        for name in names:
            try:
                root = ET.fromstring(z.read(name))
            except Exception:
                continue
            for node in root.iter():
                if node.tag.endswith("}t") and node.text:
                    out.append(node.text)
                    if sum(map(len, out)) > MAX_TEXT_CHARS:
                        return "\n".join(out)[:MAX_TEXT_CHARS]
    return "\n".join(out)[:MAX_TEXT_CHARS]


def extract_pdf_optional(path: Path) -> str:
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception:
        return ""
    try:
        reader = PdfReader(str(path))
        parts = []
        for page in reader.pages[:80]:
            parts.append(page.extract_text() or "")
            if sum(map(len, parts)) > MAX_TEXT_CHARS:
                break
        return "\n".join(parts)[:MAX_TEXT_CHARS]
    except Exception:
        return ""


def extract_text(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in {".txt", ".md"}:
        return decode_text(path.read_bytes()[:MAX_FILE_BYTES])[:MAX_TEXT_CHARS]
    if ext == ".csv":
        return extract_csv(path.read_bytes()[:MAX_FILE_BYTES])
    if ext == ".xlsx":
        return extract_xlsx(path)
    if ext == ".hwpx":
        return extract_hwpx(path)
    if ext == ".pdf":
        return extract_pdf_optional(path)
    # Legacy .hwp is intentionally metadata-only without a dedicated local parser.
    return ""


def sanitize_text(text: str) -> str:
    text = EMAIL_RE.sub("[email]", text)
    text = PHONE_RE.sub("[phone]", text)
    text = STUDENT_ID_RE.sub("[id]", text)
    return text


def classify(name: str, text: str) -> tuple[str, float]:
    hay = f"{name}\n{text[:30_000]}".lower()
    scores = {k: sum(1 for kw in kws if kw.lower() in hay) for k, kws in KEYWORDS.items()}
    best = max(scores, key=scores.get)
    count = scores[best]
    if count <= 0:
        return "document", 0.55
    return best, min(0.96, 0.68 + 0.07 * count)


def extract_due(text: str, file_mtime: float) -> str:
    base = datetime.fromtimestamp(file_mtime).date()
    candidates: list[date] = []
    for pat in DATE_PATTERNS:
        for m in pat.finditer(text[:40_000]):
            try:
                y = int(m.groupdict().get("y") or base.year)
                mo = int(m.group("m"))
                d = int(m.group("d"))
                dt = date(y, mo, d)
                if not m.groupdict().get("y") and dt < base - timedelta(days=120):
                    dt = date(y + 1, mo, d)
                if base - timedelta(days=30) <= dt <= base + timedelta(days=730):
                    candidates.append(dt)
            except Exception:
                continue
    future = sorted(x for x in candidates if x >= base - timedelta(days=1))
    return future[0].isoformat() if future else ""


def derive_title(path: Path, category: str, due: str) -> str:
    stem = re.sub(r"[_\-]+", " ", path.stem).strip()
    stem = re.sub(r"\s+", " ", stem)[:100] or "새 문서"
    label = {
        "assessment": "평가 자료",
        "admin": "행정 자료",
        "schedule": "일정 자료",
        "student_record": "학생부 자료",
        "document": "업무 자료",
    }.get(category, "업무 자료")
    return f"{stem} · {label}" + (f" · {due}" if due else "")


def file_digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def already_scanned(path: Path, stat: os.stat_result) -> bool:
    with DB_LOCK:
        row = DB.execute("SELECT mtime_ns,size,status FROM files WHERE path=?", (str(path),)).fetchone()
    return bool(row and row[0] == stat.st_mtime_ns and row[1] == stat.st_size and row[2] == "ok")


def upsert_file(path: Path, stat: os.stat_result, digest: str, status: str, error: str = "") -> None:
    with DB_LOCK:
        DB.execute(
            """INSERT INTO files(path,mtime_ns,size,digest,scanned_at,status,error)
            VALUES(?,?,?,?,?,?,?)
            ON CONFLICT(path) DO UPDATE SET mtime_ns=excluded.mtime_ns,size=excluded.size,
            digest=excluded.digest,scanned_at=excluded.scanned_at,status=excluded.status,error=excluded.error""",
            (str(path), stat.st_mtime_ns, stat.st_size, digest, now_iso(), status, error[:500]),
        )
        DB.commit()


def save_signal(path: Path, digest: str, category: str, title: str, due: str, confidence: float, text_available: bool) -> bool:
    key = f"file:{digest}:{category}:{due}"
    try:
        with DB_LOCK:
            DB.execute(
                """INSERT INTO signals(external_key,created_at,source_name,source_ext,category,title,due_date,confidence,text_available,pii_redacted)
                VALUES(?,?,?,?,?,?,?,?,?,1)""",
                (key, now_iso(), path.name[:180], path.suffix.lower(), category, title, due, confidence, 1 if text_available else 0),
            )
            DB.commit()
        return True
    except sqlite3.IntegrityError:
        return False


def process_file(path: Path) -> None:
    try:
        stat = path.stat()
        if stat.st_size <= 0 or stat.st_size > MAX_FILE_BYTES or already_scanned(path, stat):
            return
        digest = file_digest(path)
        text = sanitize_text(extract_text(path))
        category, confidence = classify(path.name, text)
        due = extract_due(text, stat.st_mtime) if text else ""
        title = derive_title(path, category, due)
        created = save_signal(path, digest, category, title, due, confidence, bool(text.strip()))
        upsert_file(path, stat, digest, "ok")
        audit("file_scan", "새 문서를 로컬에서 분석했습니다.", {"name": path.name, "category": category, "due": due, "signalCreated": created, "textAvailable": bool(text.strip())})
    except Exception as e:
        try:
            stat = path.stat()
            upsert_file(path, stat, "", "error", str(e))
        except Exception:
            pass
        audit("file_error", "문서 분석 실패", {"name": path.name, "error": str(e)[:300]})


def iter_files() -> Iterable[Path]:
    seen: set[str] = set()
    for raw in CONFIG.get("watchDirs", []):
        root = Path(os.path.expandvars(os.path.expanduser(str(raw))))
        if not root.exists() or not root.is_dir():
            continue
        try:
            entries = sorted(root.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)[:300]
        except Exception:
            continue
        for path in entries:
            try:
                if not path.is_file() or path.suffix.lower() not in SUPPORTED:
                    continue
                key = str(path.resolve())
                if key in seen:
                    continue
                seen.add(key)
                yield path
            except Exception:
                continue


def scan_once() -> int:
    count = 0
    for path in iter_files():
        before = max_seq()
        process_file(path)
        if max_seq() > before:
            count += 1
    return count


def max_seq() -> int:
    with DB_LOCK:
        row = DB.execute("SELECT COALESCE(MAX(seq),0) FROM signals").fetchone()
    return int(row[0] if row else 0)


def scan_loop() -> None:
    audit("bridge_start", "Desktop Bridge 감시를 시작했습니다.", {"version": VERSION, "watchDirs": CONFIG.get("watchDirs", [])})
    while not STOP.is_set():
        try:
            scan_once()
        except Exception as e:
            audit("scan_error", "자동 폴더 점검 실패", {"error": str(e)[:300]})
        STOP.wait(max(10, int(CONFIG.get("scanSeconds", SCAN_SECONDS))))


def snapshot(cursor: int) -> dict:
    with DB_LOCK:
        rows = DB.execute(
            """SELECT seq,external_key,created_at,source_name,source_ext,category,title,due_date,confidence,text_available,pii_redacted
            FROM signals WHERE seq>? ORDER BY seq ASC LIMIT 250""",
            (max(0, cursor),),
        ).fetchall()
        audit_rows = DB.execute("SELECT at,event,message,details FROM audit ORDER BY seq DESC LIMIT 20").fetchall()
    items = [
        {
            "seq": r[0], "externalKey": r[1], "at": r[2], "sourceName": r[3], "sourceExt": r[4],
            "category": r[5], "title": r[6], "due": r[7], "confidence": r[8],
            "textAvailable": bool(r[9]), "piiRedacted": bool(r[10]), "source": "desktop_bridge",
        }
        for r in rows
    ]
    next_cursor = items[-1]["seq"] if items else cursor
    maximum = max_seq()
    return {
        "version": VERSION,
        "cursor": next_cursor,
        "hasMore": next_cursor < maximum,
        "items": items,
        "audit": [
            {"at": a[0], "event": a[1], "message": a[2], "details": json.loads(a[3] or "{}")}
            for a in reversed(audit_rows)
        ],
        "health": {"ok": True, "host": HOST, "port": PORT, "watchDirCount": len(CONFIG.get("watchDirs", [])), "maxSeq": maximum},
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "TeacherOSBridge/36"

    def log_message(self, format: str, *args) -> None:
        return

    def _origin_ok(self) -> bool:
        return self.headers.get("Origin", "") == ALLOWED_ORIGIN

    def _token_ok(self) -> bool:
        return secrets.compare_digest(self.headers.get("X-Teacher-OS-Token", ""), str(CONFIG.get("token", "")))

    def _headers(self, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        if self._origin_ok():
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Teacher-OS-Token")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def _json(self, body: dict, status: int = 200) -> None:
        self._headers(status)
        self.wfile.write(json.dumps(body, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self) -> None:
        if not self._origin_ok():
            self._json({"ok": False, "error": "origin_not_allowed"}, 403)
            return
        self._headers(204)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/v1/health":
            if not self._origin_ok():
                self._json({"ok": False, "error": "origin_not_allowed"}, 403)
                return
            self._json({"ok": True, "version": VERSION, "paired": False, "port": PORT})
            return
        if not self._origin_ok() or not self._token_ok():
            self._json({"ok": False, "error": "not_authorized"}, 403)
            return
        if parsed.path == "/v1/snapshot":
            qs = urllib.parse.parse_qs(parsed.query)
            try:
                cursor = int((qs.get("cursor") or ["0"])[0])
            except ValueError:
                cursor = 0
            self._json(snapshot(cursor))
            return
        if parsed.path == "/v1/config":
            self._json({"version": VERSION, "watchDirs": CONFIG.get("watchDirs", []), "scanSeconds": CONFIG.get("scanSeconds", SCAN_SECONDS)})
            return
        self._json({"ok": False, "error": "not_found"}, 404)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        if not self._origin_ok() or not self._token_ok():
            self._json({"ok": False, "error": "not_authorized"}, 403)
            return
        if parsed.path == "/v1/rescan":
            created = scan_once()
            audit("manual_rescan", "Teacher OS 요청으로 폴더를 다시 확인했습니다.", {"created": created})
            self._json({"ok": True, "created": created, "cursor": max_seq()})
            return
        self._json({"ok": False, "error": "not_found"}, 404)


def main() -> int:
    ensure_dirs()
    print("Teacher OS Desktop Bridge v0.36")
    print(f"Local API: http://{HOST}:{PORT}")
    print(f"Pairing token: {CONFIG['token']}")
    print("Watch folders:")
    for d in CONFIG.get("watchDirs", []):
        print(" -", d)
    worker = threading.Thread(target=scan_loop, name="teacher-os-scan", daemon=True)
    worker.start()
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    except OSError as e:
        print(f"Bridge failed to bind: {e}", file=sys.stderr)
        return 2
    except Exception:
        traceback.print_exc()
        return 1
    finally:
        STOP.set()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
