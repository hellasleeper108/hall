import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from corpus import catalog_payload, send_json


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        send_json(self, catalog_payload(), cache=120)
