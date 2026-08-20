#!/usr/bin/env python3
"""Pull remaining Lampić figures into DH3:Plates.

Keeps the ten curated plates (Tree map, Knapp cover, …). Adds every other
substantial figure: JPEG full plate, four-color Workbench stamps, Hall's
own title as legend.
"""

from __future__ import annotations

import json
import re
import unicodedata
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageFile
from PyPDF2 import PdfReader

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parents[1]
PDF = Path("/mnt/c/Users/hella/Downloads/The_Secret_Teachings_of_All_Ages_- _Manly_Hall.pdf")
FULL = ROOT / "public" / "plates" / "full"
STAMPS = ROOT / "public" / "plates" / "stamps"
PLATES_JSON = ROOT / "data" / "plates.json"
CATALOG = ROOT / "data" / "catalog.json"

# PDF pages already curated; do not replace those files or JSON rows.
KEEP_PAGES = {1, 33, 111, 121, 149, 162, 319, 379, 425, 449}

WB = [(0, 0, 0), (0, 85, 170), (255, 136, 0), (255, 255, 255)]
BLUE = (0, 85, 170)

SKIP_TITLES = {
    "THE SECRET TEACHINGS OF ALL AGES",
    "SECRET TEACHINGS OF ALL AGES",
    "AN ENCYCLOPEDIC OUTLINE OF MASONIC",
}


def nearest(px):
    best, bd = WB[0], 10**9
    for pal in WB:
        d = (px[0] - pal[0]) ** 2 + (px[1] - pal[1]) ** 2 + (px[2] - pal[2]) ** 2
        if d < bd:
            best, bd = pal, d
    return best


def floyd(im: Image.Image, tw: int, th: int) -> Image.Image:
    im = im.convert("RGB")
    im.thumbnail((tw, th), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (tw, th), BLUE)
    canvas.paste(im, ((tw - im.size[0]) // 2, (th - im.size[1]) // 2))
    px = canvas.load()
    w, h = canvas.size
    for y in range(h):
        for x in range(w):
            old = px[x, y]
            new = nearest(old)
            px[x, y] = new
            err = (old[0] - new[0], old[1] - new[1], old[2] - new[2])
            for dx, dy, f in ((1, 0, 7), (-1, 1, 3), (0, 1, 5), (1, 1, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    r, g, b = px[nx, ny]
                    px[nx, ny] = (
                        max(0, min(255, r + err[0] * f // 16)),
                        max(0, min(255, g + err[1] * f // 16)),
                        max(0, min(255, b + err[2] * f // 16)),
                    )
    return canvas


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:48] or "fig"


def clean_ws(text: str) -> str:
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def strip_headers(text: str) -> str:
    text = re.sub(r"THE SECRET TEACHINGS OF ALL AGES", " ", text, flags=re.I)
    text = re.sub(r"Ma\s*n\s*l\s*y\s*Pa\s*l+Me\s*r\s*Ha\s*l\s*l", " ", text, flags=re.I)
    text = re.sub(r"Manly Palmer Hall", " ", text, flags=re.I)
    return text


def title_from_text(text: str, page: int) -> tuple[str, str, str]:
    """Return (title, legend, caption) from Hall's page text."""
    raw = strip_headers(text)
    t = clean_ws(raw)

    source = ""
    msrc = re.search(r"(?:From|Redrawn from)\s+([^.]{8,90})\.", t, flags=re.I)
    if msrc:
        source = clean_ws(msrc.group(0)).rstrip(".")

    title = ""
    m = re.search(
        r"([A-Z][A-Z0-9 ,.'’\-]{6,90})\.\s*(?:From |Redrawn |from )",
        t,
    )
    if m:
        title = clean_ws(m.group(1))
    if not title:
        m = re.search(r"\bLeaf\s+(\d+)\b", t, flags=re.I)
        if m:
            title = f"Celentano, leaf {m.group(1)}"
    if not title:
        caps = re.findall(r"\b([A-Z][A-Z0-9 ,.'’\-]{8,80})\b", t)
        for c in caps:
            c = clean_ws(c)
            if c in SKIP_TITLES:
                continue
            if c.count(" ") >= 1 or "'" in c:
                title = c.title() if c.isupper() else c
                break
    if not title:
        title = f"Figure, folio p.{page}"

    title = re.sub(r"\s+", " ", title).strip(" .")
    if title.isupper() and len(title) > 4:
        title = title.title()
    title = title.replace("'S ", "'s ").replace(" Of ", " of ").replace(" The ", " the ")
    title = title.replace(" And ", " and ").replace(" From ", " from ")
    if title and title[0].islower():
        title = title[0].upper() + title[1:]

    legend = source.replace("From ", "From ").strip() if source else title
    if legend.lower() == title.lower():
        legend = title

    caption = ""
    after = t
    if source:
        idx = t.lower().find(source.lower())
        if idx >= 0:
            after = t[idx + len(source) :].lstrip(" .")
    sents = re.split(r"(?<=[.!?])\s+", after)
    for s in sents:
        s = s.strip()
        if len(s) < 40:
            continue
        if s.isupper():
            continue
        caption = s
        break
    if len(caption) > 360:
        caption = caption[:357].rsplit(" ", 1)[0] + "."
    return title, legend, caption


def chapter_for(page: int, chapters: list[dict]) -> str:
    found = chapters[0]["id"]
    for ch in chapters:
        if ch["page"] <= page:
            found = ch["id"]
        else:
            break
    if page < 11:
        return "preface"
    return found


def iter_images(page):
    resources = page.get("/Resources")
    if not resources:
        return
    resources = resources.get_object()
    xobj = resources.get("/XObject")
    if not xobj:
        return
    xobj = xobj.get_object()
    for name in xobj:
        obj = xobj[name].get_object()
        if obj.get("/Subtype") != "/Image":
            continue
        w = int(obj.get("/Width") or 0)
        h = int(obj.get("/Height") or 0)
        yield name, obj, w, h


def image_from_obj(obj) -> Image.Image | None:
    filt = obj.get("/Filter")
    if isinstance(filt, list):
        filt = filt[-1]
    filt = str(filt) if filt else ""
    data = obj.get_data()
    if "DCTDecode" in filt:
        try:
            return Image.open(BytesIO(data)).convert("RGB")
        except Exception:
            return None
    w = int(obj.get("/Width") or 0)
    h = int(obj.get("/Height") or 0)
    cs = str(obj.get("/ColorSpace") or "")
    bpc = int(obj.get("/BitsPerComponent") or 8)
    if bpc != 8 or not data or not w or not h:
        return None
    try:
        if "DeviceRGB" in cs and len(data) >= w * h * 3:
            return Image.frombytes("RGB", (w, h), data[: w * h * 3])
        if "DeviceGray" in cs and len(data) >= w * h:
            return Image.frombytes("L", (w, h), data[: w * h]).convert("RGB")
    except Exception:
        return None
    return None


def save_full(im: Image.Image, dest: Path) -> str:
    im = im.convert("RGB")
    w, h = im.size
    if max(w, h) > 1000:
        im.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
    dest = dest.with_suffix(".jpg")
    im.save(dest, "JPEG", quality=82, optimize=True)
    return dest.name


def main():
    FULL.mkdir(parents=True, exist_ok=True)
    STAMPS.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    chapters = catalog["chapters"]
    existing = json.loads(PLATES_JSON.read_text(encoding="utf-8"))
    keep_ids = {p["id"] for p in existing["plates"]}

    reader = PdfReader(str(PDF))
    used = set(keep_ids)
    new_rows = []
    seen_pages: dict[int, int] = {}

    for i, page in enumerate(reader.pages):
        pdf_page = i + 1
        if pdf_page in KEEP_PAGES:
            continue
        text = page.extract_text() or ""
        imgs = list(iter_images(page))
        for _name, obj, w, h in imgs:
            if w * h < 40000:
                continue
            if min(w, h) < 150:
                continue
            aspect = w / h if h else 0
            if aspect > 5 or aspect < 0.18:
                continue
            im = image_from_obj(obj)
            if im is None:
                print("skip decode", pdf_page, w, h)
                continue
            seen_pages[pdf_page] = seen_pages.get(pdf_page, 0) + 1
            n = seen_pages[pdf_page]
            title, legend, caption = title_from_text(text, pdf_page)
            cid = chapter_for(pdf_page, chapters)
            base = slugify(title)
            if n > 1:
                base = f"{base}-{n}"
            pid = base
            k = 2
            while pid in used:
                pid = f"{base}-p{pdf_page}" if k == 2 else f"{base}-p{pdf_page}-{k}"
                k += 1
            used.add(pid)
            fname = save_full(im, FULL / pid)
            floyd(im, 48, 40).save(STAMPS / f"{pid}.png")
            floyd(im, 96, 80).save(STAMPS / f"{pid}@2.png")
            ch_title = next((c["title"] for c in chapters if c["id"] == cid), cid)
            if not caption:
                caption = f"Figure from Hall's chapter “{ch_title},” folio p.{pdf_page}."
            row = {
                "id": pid,
                "file": fname,
                "pdf_page": pdf_page,
                "chapter": cid,
                "title": title,
                "legend": legend[:180],
                "caption": caption,
            }
            new_rows.append(row)
            print(f"{pdf_page:3}  {pid:40}  {w}x{h}  {cid}  {title[:50]}")

    existing["note"] = (
        "Figures from the Lampić 2009 PDF. Workbench stamps are four-color; "
        "the viewer may show the source. The Tree is the map."
    )
    existing["plates"] = existing["plates"] + new_rows
    PLATES_JSON.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote", len(existing["plates"]), "plates (", len(new_rows), "new)")


if __name__ == "__main__":
    main()
