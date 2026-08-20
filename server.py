#!/usr/bin/env python3
"""HALL 1.3 — Hall of Ages BBS on Workbench chrome."""

from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from corpus import (
    HOST,
    PORT,
    build_status,
    catalog_payload,
    chapter_payload,
    find_chapter,
    gematria,
    load_diskmag,
    load_guide,
    load_seers,
    planetary_hour,
    search_all,
    send_json,
    xref_lookup,
)

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "public"
if not STATIC.exists():
    STATIC = ROOT / "static"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC), **kwargs)

    def log_message(self, fmt, *args):
        import sys

        sys.stderr.write("[hall] " + (fmt % args) + "\n")

    def _err(self, message, code=500):
        send_json(self, {"error": message}, code=code, cache=0)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        q = (query.get("q") or query.get("id") or [""])[0]
        try:
            if path == "/api/status":
                return send_json(self, build_status(), cache=15)
            if path == "/api/catalog":
                return send_json(self, catalog_payload(), cache=120)
            if path == "/api/chapter":
                rec = chapter_payload(q) if q else None
                if rec is None:
                    found = find_chapter(q)
                    rec = chapter_payload(found["id"]) if found else None
                if rec is None:
                    return self._err("scroll not on this node", 404)
                return send_json(self, rec, cache=120)
            if path == "/api/who":
                return send_json(self, load_seers(), cache=30)
            if path == "/api/search":
                return send_json(self, search_all(q), cache=60)
            if path == "/api/gematria":
                return send_json(self, gematria(q), cache=30)
            if path == "/api/xref":
                return send_json(self, xref_lookup(q), cache=60)
            if path == "/api/hour":
                return send_json(self, planetary_hour(), cache=15)
            if path == "/api/guide":
                return send_json(self, load_guide(), cache=120)
            if path == "/api/diskmag":
                return send_json(self, load_diskmag(), cache=120)
            if path in ("/ceefax", "/ceefax/"):
                self.path = "/ceefax/index.html"
            if path in ("/diskmag", "/diskmag/"):
                self.path = "/diskmag/index.html"
            if path in ("/", "/index.html"):
                self.path = "/index.html"
            return super().do_GET()
        except Exception as exc:  # noqa: BLE001
            self._err(str(exc), 500)


def main():
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"HALL 1.3  http://{HOST}:{PORT}/")
    print("Hall of Ages BBS — Secret Teachings of All Ages, 1928")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDF0: motor off")
        httpd.server_close()


if __name__ == "__main__":
    main()
