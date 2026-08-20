import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from corpus import qs, send_json, xref_lookup


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        send_json(self, xref_lookup((qs(self).get("q") or [""])[0]), cache=60)
