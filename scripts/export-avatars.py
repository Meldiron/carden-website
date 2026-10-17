"""Export some of Carden's avatars (the app's lib/widgets/icons.dart AppIcons.avatars: Material rounded icons
on a coloured disc) as SVG path data from Flutter's MaterialIcons font, for Play together's player list.
Needs fontTools (`pip install fonttools`), the Carden repo next to this one and the Flutter SDK:

    python3 scripts/export-avatars.py ../card-jigsaw-world ~/flutter src/components/site/avatars.ts
"""
import re, sys, json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

repo, sdk, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
icons_dart = (repo / "lib/widgets/icons.dart").read_text()
flutter_icons = (sdk / "packages/flutter/lib/src/material/icons.dart").read_text()
font = TTFont(sdk / "bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf")
cmap = font.getBestCmap()
glyphs = font.getGlyphSet()
upm = font["head"].unitsPerEm
ascent = font["hhea"].ascent

# The avatars the page uses: the three in the store scene, then the pool new players draw from.
KEYS = ["fox", "flower", "sun", "leaf", "drop", "star", "heart", "moon", "music", "camera", "palette", "diamond",
        "anchor", "wave", "coffee", "bike", "plane", "umbrella", "cake", "globe", "mountain"]

defs = {}
for m in re.finditer(r"AvatarDef\('(\w+)', '([^']+)', Icons\.(\w+), Color\(0x([0-9A-Fa-f]{8})\)", icons_dart):
    defs[m.group(1)] = (m.group(2), m.group(3), "#" + m.group(4)[2:].lower())

rows = []
for key in KEYS:
    name, icon, colour = defs[key]
    cp = re.search(rf"static const IconData {icon} = IconData\(0x([0-9a-f]+)", flutter_icons)
    code = int(cp.group(1), 16)
    glyph = glyphs[cmap[code]]
    pen = SVGPathPen(glyphs)
    # Font units, y up -> a 0..24 box, y down.
    k = 24 / upm
    glyph.draw(TransformPen(pen, (k, 0, 0, -k, 0, ascent * k)))
    path = pen.getCommands()
    path = re.sub(r"(\d+\.\d{2})\d+", r"\1", path)
    rows.append({"key": key, "name": name, "color": colour, "path": path})

ts = ("// Carden's avatars (lib/widgets/icons.dart, AppIcons.avatars): the disc colour and the Material rounded\n"
      "// symbol, exported from Flutter's MaterialIcons font (Apache License 2.0) by scripts/export-avatars.py.\n"
      "// A 24 x 24 box, like Material icons. Regenerate rather than edit.\n"
      "export type Avatar = { key: string; name: string; color: string; path: string }\n\n"
      "export const avatars: Avatar[] = " + json.dumps(rows, indent=2) + "\n")
out.write_text(ts)
print(len(rows), "avatars", upm, ascent)
