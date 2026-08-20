"""HALL 1.3 — catalog, folio, gematria, planetary hour."""

from __future__ import annotations

import json
import os
import re
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("HALL_PORT", "1995"))
HOST = os.environ.get("HALL_HOST", "127.0.0.1")

PLANETS = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]
# Python weekday: Mon=0 … Sun=6
DAY_RULER = ["Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Sun"]
PLANET_METAL = {
    "Saturn": "lead",
    "Jupiter": "tin",
    "Mars": "iron",
    "Sun": "gold",
    "Venus": "copper",
    "Mercury": "quicksilver",
    "Moon": "silver",
}


def _data_dir() -> Path:
    for path in (ROOT / "data", Path.cwd() / "data"):
        if (path / "catalog.json").exists():
            return path
    return ROOT / "data"


DATA = _data_dir()


def _read_json(path: Path):
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def load_catalog():
    return _read_json(DATA / "catalog.json")


def load_seers():
    return _read_json(DATA / "seers.json")


def load_guide():
    return _read_json(DATA / "guide.json")


def load_chapter(cid: str):
    path = DATA / "chapters" / f"{cid}.json"
    if not path.exists():
        return None
    return _read_json(path)


def load_folio(cid: str) -> str:
    path = DATA / "folio" / f"{cid}.txt"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def build_status():
    cat = load_catalog()
    ready = sum(1 for c in cat["chapters"] if c.get("ready"))
    return {
        "name": "HALL",
        "version": "1.3",
        "host": HOST,
        "port": PORT,
        "runtime": "vercel" if os.environ.get("VERCEL") else "local",
        "now": time.time(),
        "folio": cat["folio"],
        "sysop": cat["sysop"],
        "node": cat["node"],
        "chapters": len(cat["chapters"]),
        "copied": ready,
        "hour": planetary_hour(),
    }


def find_chapter(q: str):
    qn = (q or "").strip().lower()
    if not qn:
        return None
    chapters = load_catalog()["chapters"]
    for ch in chapters:
        if qn == ch["id"] or qn == str(ch["rank"]) or qn == ch["title"].lower():
            return ch
    for ch in chapters:
        if ch["id"].startswith(qn):
            return ch
    for ch in chapters:
        blob = " ".join(
            [ch["id"], ch["title"], str(ch["rank"]), ch.get("echo", ""), ch.get("blurb", "")]
        ).lower()
        if qn in blob:
            return ch
    return None


def chapter_payload(cid: str):
    meta = find_chapter(cid)
    if not meta:
        return None
    body = load_chapter(meta["id"]) or {}
    folio = load_folio(meta["id"])
    return {
        **meta,
        "signal": body.get("signal", ""),
        "translation": body.get("translation", ""),
        "folio": folio,
        "see_also": body.get("see_also") or [],
        "correspondences": body.get("correspondences") or [],
        "rite": body.get("rite") or {},
    }


def catalog_payload():
    cat = load_catalog()
    return {
        "folio": cat["folio"],
        "author": cat["author"],
        "year": cat["year"],
        "note": cat["note"],
        "sysop": cat["sysop"],
        "node": cat["node"],
        "echoes": cat["echoes"],
        "chapters": cat["chapters"],
        "copied": sum(1 for c in cat["chapters"] if c.get("ready")),
    }


def english_ordinal(text: str) -> tuple[int, list[str]]:
    letters = [ch.upper() for ch in text if "A" <= ch.upper() <= "Z"]
    return sum(ord(ch) - 64 for ch in letters), letters


_STOP = {
    "the", "and", "that", "not", "was", "for", "with", "from", "this", "his",
    "are", "but", "had", "have", "were", "which", "they", "been", "their",
    "one", "all", "who", "has", "its", "into", "than", "then", "them",
    "also", "only", "over", "after", "before", "other", "first", "does",
}


def _tokens(text: str) -> list[str]:
    return re.findall(r"[A-Za-z][A-Za-z']{2,}", text)


_GEM_INDEX: dict[int, list[dict]] | None = None


def gematria_index() -> dict[int, list[dict]]:
    global _GEM_INDEX
    if _GEM_INDEX is not None:
        return _GEM_INDEX
    index: dict[int, list[dict]] = {}
    seen: set[tuple[int, str]] = set()
    cat = load_catalog()
    for ch in cat["chapters"]:
        if not ch.get("ready"):
            continue
        body = load_chapter(ch["id"]) or {}
        blob = " ".join(
            [
                body.get("signal") or "",
                body.get("translation") or "",
                load_folio(ch["id"]),
            ]
        )
        for word in _tokens(blob):
            key = word.lower().strip("'")
            if len(key) < 4 or key in _STOP:
                continue
            val, _ = english_ordinal(key)
            if not val:
                continue
            mark = (val, key)
            if mark in seen:
                continue
            seen.add(mark)
            index.setdefault(val, []).append(
                {"word": key, "value": val, "chapter": ch["id"], "title": ch["title"]}
            )
    _GEM_INDEX = index
    return index


def gematria(text: str) -> dict:
    text = (text or "").strip()
    val, letters = english_ordinal(text)
    reduction = ((val - 1) % 9) + 1 if val else 0
    reverse = sum(27 - (ord(ch) - 64) for ch in letters)
    hits = []
    if val:
        for rec in gematria_index().get(val, []):
            if rec["word"] != text.lower():
                hits.append(rec)
            if len(hits) >= 24:
                break
    return {
        "query": text,
        "letters": "".join(letters),
        "ordinal": val,
        "reduction": reduction,
        "reverse": reverse,
        "hits": hits,
        "note": "English ordinal on Hall's folio. Codex owns Hebrew.",
    }


def xref_lookup(q: str) -> dict:
    qn = (q or "").strip().lower()
    hits = []
    if not qn:
        return {"query": q, "hits": []}
    cat = load_catalog()
    for ch in cat["chapters"]:
        body = load_chapter(ch["id"]) if ch.get("ready") else None
        corr = (body or {}).get("correspondences") or []
        blob = " ".join(
            [ch["id"], ch["title"], ch.get("echo", ""), ch.get("blurb", ""), " ".join(corr)]
        ).lower()
        if qn in blob or qn in corr:
            hits.append(
                {
                    "id": ch["id"],
                    "title": ch["title"],
                    "echo": ch.get("echo"),
                    "blurb": ch.get("blurb"),
                    "correspondences": corr,
                    "ready": bool(ch.get("ready")),
                }
            )
    return {"query": q, "hits": hits[:20]}


def search_all(q: str, limit: int = 40) -> dict:
    qn = (q or "").strip().lower()
    if not qn:
        return {"query": q, "hits": []}
    hits = []
    cat = load_catalog()
    for ch in cat["chapters"]:
        body = load_chapter(ch["id"]) if ch.get("ready") else {}
        blob = " ".join(
            [
                ch["id"],
                ch["title"],
                ch.get("blurb", ""),
                ch.get("echo", ""),
                (body or {}).get("translation") or "",
                (body or {}).get("signal") or "",
            ]
        ).lower()
        if qn in blob:
            hits.append(
                {
                    "kind": "chapter",
                    "id": ch["id"],
                    "name": ch["title"],
                    "detail": ch.get("blurb") or "",
                    "ready": bool(ch.get("ready")),
                }
            )
        if len(hits) >= limit:
            break
    for echo in cat["echoes"]:
        blob = " ".join([echo["id"], echo["name"], echo.get("summary", "")]).lower()
        if qn in blob:
            hits.append(
                {"kind": "echo", "id": echo["id"], "name": echo["name"], "detail": echo.get("summary") or ""}
            )
    return {"query": q, "hits": hits[:limit]}


def planetary_hour(dt: datetime | None = None) -> dict:
    dt = dt or datetime.now()
    sunrise = 6
    minutes = dt.hour * 60 + dt.minute
    hour_index = ((minutes - sunrise * 60) // 60) % 24
    day_planet = DAY_RULER[dt.weekday()]
    start = PLANETS.index(day_planet)
    planet = PLANETS[(start + hour_index) % 7]
    return {
        "planet": planet,
        "metal": PLANET_METAL[planet],
        "day_ruler": day_planet,
        "hour_index": hour_index,
        "period": "day" if hour_index < 12 else "night",
        "clock": dt.strftime("%H:%M"),
        "weekday": dt.strftime("%A"),
    }


def send_json(req: BaseHTTPRequestHandler, payload, code: int = 200, cache: int = 30) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req.send_response(code)
    req.send_header("Content-Type", "application/json; charset=utf-8")
    if cache > 0:
        req.send_header("Cache-Control", f"public, s-maxage={cache}, stale-while-revalidate=600")
    else:
        req.send_header("Cache-Control", "no-store")
    req.send_header("Content-Length", str(len(body)))
    req.end_headers()
    req.wfile.write(body)


def qs(req: BaseHTTPRequestHandler) -> dict[str, list[str]]:
    return parse_qs(urlparse(req.path).query)
