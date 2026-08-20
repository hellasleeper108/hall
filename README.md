# HALL 1.3

Amiga Workbench–inspired **Hall of Ages BBS**. Manly P. Hall's *The Secret Teachings of All Ages* (1928, no renewal) recast as a dial-in folio: three depths, degrees, echoes, and a gematria door that searches Hall's English.

This is a board, not a second Codex. Codex keeps the Hebrew desk and the Tree gadget. Bbsbench dials other boards. HALL *is* a board.

## What it shows

**DH0:Files** lists the 51 nodes of the 1928 outline. Eight are copied in this slice (Hermes, Pyramid, Pythagoras, Hiramic legend, Qabbalah, Sephiroth, Tarot, Cryptogram). The rest sit as TBA until the copyist takes them from the folio.

Each copied node has three depths:

- **NFO** — one screen. Neophyte.
- **TXT** — a modern walkthrough of Hall's argument. Fellowcraft.
- **FOL** — the 1928 opening, cleaned. Adept.

Read three NFO files and pass a rite to raise fellowcraft. Read three TXT and a second rite for adept.

**NUM:Gematria** is English ordinal against Hall's own words, not Hebrew. **XREF:See** walks correspondences (mercury, fool, hiram…). **WHO** is idle seers from the last chapter. Planetary hour retitles the menubar; it does not add a fifth color.

Personal state lives in `localStorage` (`hall.handle`, `hall.degree`, `hall.read`, `hall.rites`).

## Run locally

```bash
python3 server.py
# open http://127.0.0.1:1995/
```

Port: `HALL_PORT=8080`. Bind: `HALL_HOST=0.0.0.0` (defaults to loopback).

Stdlib only.

## Vercel

`public/` is the Workbench. `api/*.py` wraps `corpus.py` + `data/`. Same layout as Codex / Drawer.

```bash
npx vercel --prod
```

Then point `hall.hellasleeper.com` at the project. Drawer does not list this disk until a `remote` is added to `drawer/data/disks.json`.

## Docker

```bash
docker compose up --build -d
# http://127.0.0.1:1995/
```

## CLI

```
1> help
1> files
1> read hermes
1> gematria hiram
1> xref mercury
1> who
1> hour
1> handle NEO
1> degree
```

F1 help · F2 FILES · F3 SCROLL · F4 XREF · F5 DOOR · F6 GUIDE · F7 CEEFAX.

## CEEFAX 1928

Same corpus, different furniture. https://hall.hellasleeper.com/ceefax

Hall's folio pages are the keypad (`093` Hermes, `227` Hiram). Red NFO / green TXT / yellow FOL. Degrees still gate. Page `033` is not in the magazine.

## DISKMAG 01

https://hall.hellasleeper.com/diskmag

Commodore 64 Loadstar sitting. Issue 01 is Hermes. `LOAD"HALL-01",8,1` then 1–0 from the menu. TXT/FOL still gated. HOUR.BAS and GEMATRIA.BAS list and run against the live APIs.

## Notes

- Homage to Workbench 1.3 / Kickstart — not a Commodore product.
- Public-domain 1928 text + original translations. No Liber AL.
- Other formats (diskmag, AmigaGuide, teletext, scene release) are in `docs/IDEAS.md`.
- Next free lot port after HALL is 1996. Drawer does not list this disk until asked.
