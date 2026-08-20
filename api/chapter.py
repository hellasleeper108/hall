import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from corpus import chapter_payload, find_chapter, qs, send_json


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = (qs(self).get("id") or qs(self).get("q") or [""])[0]
        rec = chapter_payload(q) if q else None
        if rec is None:
            found = find_chapter(q)
            rec = chapter_payload(found["id"]) if found else None
        if rec is None:
            send_json(self, {"error": "scroll not on this node"}, code=404, cache=0)
            return
        send_json(self, rec, cache=120)
