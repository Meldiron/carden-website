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

import argparse, json, re, shutil, sys, urllib.request
from pathlib import Path

from PIL import Image

SITE = Path(__file__).resolve().parents[1]
PUBLIC = SITE / "public"

# Framed phone screens: name -> scene in store/raw (each in both themes, see above).
PHONES = {
    "hero": "25_hero",
    "daily": "18_daily_month_grid",
    "painting": "26_painting",
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

    icons = carden / "web"
    shutil.copy(icons / "favicon.png", PUBLIC / "favicon.png")
    (PUBLIC / "icons").mkdir(exist_ok=True)
    for f in ["apple-touch-icon.png", "Icon-192.png", "Icon-512.png", "Icon-maskable-192.png", "Icon-maskable-512.png"]:
        shutil.copy(icons / "icons" / f, PUBLIC / "icons" / f)
    shutil.copy(carden / "tools" / "brand" / "out" / "carden-icon-light.svg", PUBLIC / "carden-icon.svg")
    print("icons copied")


if __name__ == "__main__":
    main()
