#!/usr/bin/env python3
"""Build the site's images from the Carden app repo (the same captures as the App Store screenshots).

    ~/Documents/GitHub/card-jigsaw-world/.venv/bin/python scripts/prepare-assets.py [--carden PATH]

Reads the App Store captures in the Carden repo's `store/raw/` in both themes: `<scene>_light.png`
(the light run, the one the store slides use) becomes `<name>.webp`, and `<scene>.png` (the dark run
of the same scenes) becomes `<name>-dark.webp`, so the site shows light screens on its light theme and
dark ones on its dark theme. Frames each screen in the store slides' iPhone frame
(tools/store/compose_screenshots.py), crops boards and the streak card, downloads pack covers from
Carden's own Storage (skip with --no-covers), copies the app icons, and writes everything into
public/. Re-run after new captures (see the Carden store-screenshots skill); the files are
committed, so the site builds without the app repo.
"""
from __future__ import annotations

import argparse, json, re, shutil, sys, urllib.parse, urllib.request
from pathlib import Path

from PIL import Image

SITE = Path(__file__).resolve().parents[1]
PUBLIC = SITE / "public"

# Framed phone screens: name -> scene in store/raw (each in both themes, see above).
PHONES = {
    "hero": "25_hero",
    "daily": "18_daily_month_grid",
    "giant-board": "27_giant",
    "giant-zoom": "30_giant_zoom",
    "my-puzzles": "20_my_puzzles",
    "quests": "13_quests",
    "friends": "22_social_league",
    "home": "31_home_streak",
}
# Boards cut four ways (the same lagoon), cropped from game captures.
BOARDS = {"cards": "06_mode_cards", "squares": "07_mode_squares", "triangles": "08_mode_triangles", "hexagons": "09_mode_hexagons"}
# Cards lifted from a screen: name -> (scene, (l, t, r, b) in capture px).
CROPS = {"streak": ("31_home_streak", (60, 1485, 1260, 1997))}
# Pictures the page plays with or shows: name -> (puzzle id, 3:4 crop?). From Carden's own Storage,
# all public domain or CC0: three daily pictures (the widgets; 16 Oct, 26 Sep and 11 Sep 2026), Monet's chrysanthemums
# (the Painting board, the same picture as the Painting capture), the Hölderlin Tower (the giant board, as in
# the giant capture) and three of the photos in the My
# Puzzles capture (the photo prints).
PICTURES = {
    "lorikeet": ("daily-2026-10-16", False), "barn": ("daily-2026-09-26", False), "primrose": ("daily-2026-09-11", False),
    "monet": ("p-2f9f0b647f9f", True), "holderlin": ("p-86961eb4f439", True),
    "corgi": ("p-62ce633fc70a", True), "kitten": ("p-de0b799403de", True), "lighthouse": ("p-3b694ec057be", True),
}
# The main catalogue pictures inside the app screens (store capture test: hero, shape boards, giant
# board, My Puzzles); credited with the rest.
IN_SCREENS = ["pack-tulip-fields-08", "p-00df45e91273", "p-86961eb4f439", "pack-pastries-09", "pack-islands-09"]
# Light run: <scene>_light.png -> <name>.webp; dark run: <scene>.png -> <name>-dark.webp.
THEMES = [("_light", ""), ("", "-dark")]
# Pack covers for the endless row (no AI packs).
COVERS = ["pack-northern-lights", "pack-tulip-fields", "pack-parrots", "pack-hot-air-balloons", "pack-cherry-blossom",
          "pack-kyoto", "pack-santorini", "pack-japanese-prints", "pack-lavender", "pack-nebulae", "pack-venice",
          "pack-sunflowers", "pack-islands", "pack-hummingbirds", "pack-canyons", "pack-fruit-markets",
          "pack-lighthouses", "pack-frogs", "pack-sushi", "pack-tiles"]
APPWRITE, PROJECT = "https://fra.cloud.appwrite.io/v1", "6acb4de5003e38d5ebd9"


def webp(im: Image.Image, path: Path, width: int, quality: int = 82) -> None:
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    print(f"{path.relative_to(SITE)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def three_four(im: Image.Image) -> Image.Image:
    """Centre crop to the 3:4 tile the row shows, so no pixels are downloaded only to be cropped away."""
    h = min(im.height, round(im.width * 4 / 3))
    w = min(im.width, round(h * 3 / 4))
    left, top = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((left, top, left + w, top + h))


def _get(path: str, queries: list | None = None) -> dict:
    q = "&".join("queries[]=" + urllib.parse.quote(json.dumps(x)) for x in (queries or []))
    req = urllib.request.Request(f"{APPWRITE}{path}{'?' + q if q else ''}", headers={"X-Appwrite-Project": PROJECT})
    return json.load(urllib.request.urlopen(req))


def _licence_url(source: str) -> str | None:
    m = re.search(r"\b(CC0|CC BY(?:-SA)?)\b\s*([\d.]+)?", source)
    if not m:
        return None
    kind, version = m.group(1).removeprefix("CC ").replace("CC0", "CC0"), m.group(2)
    if kind == "CC0":
        return "https://creativecommons.org/publicdomain/zero/1.0/"
    return f"https://creativecommons.org/licenses/{kind.lower()}/{version or '2.0'}/"


def _page_url(url: str) -> str:
    """Wikimedia upload addresses lead to the file's page, where its licence is stated."""
    m = re.search(r"upload\.wikimedia\.org/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?]+)", url)
    return f"https://commons.wikimedia.org/wiki/File:{m.group(1)}" if m else url


def write_credits() -> None:
    """Every catalogue picture the page shows, with its author and licence (src/components/site/picture-credits.json)."""
    rows = []
    for pid in COVERS:
        src = _get(f"/tablesdb/cjw/tables/packs/rows/{pid}")["coverSourceUrl"]
        found = _get("/tablesdb/cjw/tables/puzzles/rows", [{"method": "equal", "attribute": "sourceUrl", "values": [src]}, {"method": "limit", "values": [1]}])["rows"]
        rows += found[:1]
    for pid in [p for p, _ in PICTURES.values()] + IN_SCREENS:
        rows.append(_get(f"/tablesdb/cjw/tables/puzzles/rows/{pid}"))
    credits, seen = [], set()
    for r in rows:
        if r["$id"] in seen:
            continue
        seen.add(r["$id"])
        source = r.get("source") or ""
        author = (r.get("author") or "").strip()
        author = author.split("Minor edits")[0].strip()
        if author.lower().startswith("public domain") or len(author) > 80 or author.lower() == "unknown":
            author = "Unknown author"
        credits.append({
            "title": r.get("title"), "author": author, "licence": source.split(", ", 1)[-1].replace("CC CC0", "CC0"), "licenceUrl": _licence_url(source),
            "where": source.split(", ", 1)[0], "url": _page_url(r.get("sourceUrl") or ""),
        })
    out = SITE / "src" / "components" / "site" / "picture-credits.json"
    out.write_text(json.dumps(sorted(credits, key=lambda c: c["title"].lower()), indent=2, ensure_ascii=False) + "\n")
    print(f"{out.relative_to(SITE)}  {len(credits)} pictures")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--carden", type=Path, default=SITE.parent / "card-jigsaw-world")
    ap.add_argument("--no-covers", action="store_true", help="keep the pack covers already in public/covers")
    ap.add_argument("--theme", choices=["light", "dark", "both"], default="both", help="which run's captures to use")
    a = ap.parse_args()
    carden = a.carden.resolve()
    raw = carden / "store" / "raw"
    sys.path.insert(0, str(carden / "tools" / "store"))
    import compose_screenshots as cs  # the store slides' phone frame and status bar

    def load(name: str) -> Image.Image:
        p = raw / f"{name}.png"
        if not p.exists():
            sys.exit(f"{p} is missing: run the Carden store capture first (store-screenshots skill)")
        return Image.open(p).convert("RGB")

    boards = json.loads((raw / "boards.json").read_text())
    for cap_suffix, out_suffix in [t for t in THEMES if a.theme == "both" or (t[1] == "-dark") == (a.theme == "dark")]:
        dark = out_suffix == "-dark"
        for name, scene in PHONES.items():
            framed = cs.phone(load(scene + cap_suffix).resize((cs.RAW_W, cs.RAW_H)), 900, (20, 20, 24) if dark else (240, 240, 244))
            webp(framed, PUBLIC / "screens" / f"{name}{out_suffix}.webp", 900)
        for name, scene in BOARDS.items():
            l, t, w, h = boards.get(scene + cap_suffix) or boards[scene]
            webp(load(scene + cap_suffix).crop((round(l), round(t), round(l + w), round(t + h))), PUBLIC / "boards" / f"{name}{out_suffix}.webp", 900)
        for name, (scene, box) in CROPS.items():
            webp(load(scene + cap_suffix).crop(box), PUBLIC / "cards" / f"{name}{out_suffix}.webp", 1200, quality=88)

    for pid in [] if a.no_covers else COVERS:
        req = urllib.request.Request(f"{APPWRITE}/tablesdb/cjw/tables/packs/rows/{pid}", headers={"X-Appwrite-Project": PROJECT})
        row = json.load(urllib.request.urlopen(req))
        url = row["coverUrl"]
        url = re.sub(r"width=\d+", "width=640", url) if "width=" in url else url.replace("/view?", "/preview?") + "&width=640"
        tmp = PUBLIC / "covers" / f"{pid}.jpg"
        tmp.parent.mkdir(parents=True, exist_ok=True)
        tmp.write_bytes(urllib.request.urlopen(url, timeout=60).read())
        # 480 px: twice the widest tile (224 px), small enough to load the whole row up front.
        webp(three_four(Image.open(tmp).convert("RGB")), PUBLIC / "covers" / f"{pid.removeprefix('pack-')}.webp", 480, quality=78)
        tmp.unlink()

    for name, (pid, board) in PICTURES.items():
        req = urllib.request.Request(f"{APPWRITE}/tablesdb/cjw/tables/puzzles/rows/{pid}", headers={"X-Appwrite-Project": PROJECT})
        url = json.load(urllib.request.urlopen(req))["imageUrl"].replace("/view?", "/preview?") + "&width=1080"
        tmp = PUBLIC / "pictures" / f"{name}.jpg"
        tmp.parent.mkdir(parents=True, exist_ok=True)
        tmp.write_bytes(urllib.request.urlopen(url, timeout=60).read())
        im = Image.open(tmp).convert("RGB")
        webp(three_four(im) if board else im, PUBLIC / "pictures" / f"{name}.webp", 900, quality=82)
        tmp.unlink()

    write_credits()

    icons = carden / "web"
    (PUBLIC / "icons").mkdir(exist_ok=True)
    for f in ["apple-touch-icon.png", "Icon-192.png", "Icon-512.png", "Icon-maskable-192.png", "Icon-maskable-512.png"]:
        shutil.copy(icons / "icons" / f, PUBLIC / "icons" / f)
    shutil.copy(carden / "tools" / "brand" / "out" / "carden-icon-light.svg", PUBLIC / "carden-icon.svg")
    print("icons copied")


if __name__ == "__main__":
    main()
