#!/usr/bin/env node
// Exports the Carden lotus for the logo section, straight from the app's own drawing
// (card-jigsaw-world/tools/brand/icon-glass.js, the final icon "FV1"), so the site never redraws it:
//
//   node scripts/export-lotus.mjs [path/to/card-jigsaw-world]
//
// public/brand/looks/<look>.svg    the icon in every iOS look (Default, Dark, Clear, Tinted; light and dark)
// public/brand/tints/<tint>-<light|dark>.svg   the Tinted look in a few tint colours
// public/brand/layers/<theme>/<piece>.svg      each glass piece alone, for the exploded view
// public/favicon.svg                           the flower alone, cropped close, light and dark glass in one file
// src/components/site/lotus-geometry.ts        the pieces' outlines with their anchors and handles
import { createRequire } from "node:module"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const carden = resolve(process.argv[2] ?? join(site, "..", "card-jigsaw-world"))
const source = join(carden, "tools", "brand", "icon-glass.js")
const brand = createRequire(import.meta.url)(source)
const icon = brand.ICONS.find((i) => i.id === brand.FINAL)
if (!icon) throw new Error(`${brand.FINAL} is not in ${source}`)

const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, text)
  console.log(`${path.slice(site.length + 1)}  ${(text.length / 1024).toFixed(1)} KB`)
}
const out = (...p) => join(site, "public", "brand", ...p)

// Every look iOS offers. Clear has no ground of its own (it shows the wallpaper through it).
const looks = { default: "light", dark: "dark", "clear-light": "clearL", "clear-dark": "clearD", "tinted-light": "tintL", "tinted-dark": "tintD" }
for (const [name, mode] of Object.entries(looks)) write(out("looks", `${name}.svg`), brand.svg(brand.FINAL, mode, { size: 512 }))

// Tinted in a few of the colours a person can pick on their Home Screen.
const tints = { cobalt: "#5B78E6", rose: "#E0567F", amber: "#D9952B", sage: "#4E9F7E", plum: "#8D63C9", graphite: "#6B7280" }
for (const [name, tint] of Object.entries(tints)) {
  write(out("tints", `${name}-light.svg`), brand.svg(brand.FINAL, "tintL", { size: 512, tint }))
  write(out("tints", `${name}-dark.svg`), brand.svg(brand.FINAL, "tintD", { size: 512, tint }))
}

// One glass piece at a time: the drawing calls C.piece() once per piece, in painting order
// (left petal, right petal, bud, leaf cup, base cup); every other call draws nothing.
const pieceNames = ["petal-left", "petal-right", "bud", "leaf", "base"]
const draw = icon.draw
for (const [theme, mode] of [["light", "light"], ["dark", "dark"]]) {
  pieceNames.forEach((name, target) => {
    icon.draw = (C) => {
      const real = C.piece
      let k = 0
      C.piece = (...args) => (k++ === target ? real(...args) : "")
      return draw(C)
    }
    write(out("layers", theme, `${name}.svg`), brand.svg(brand.FINAL, mode, { size: 512, background: false }))
  })
}
icon.draw = draw

// The favicon: the flower alone on a transparent ground, cropped close (the artwork spans y 14.5 to
// 86.6 and x 19.5 to 80.5; a little room below for the glass's shadow). Light and dark glass in one
// file; the browser's colour scheme picks one.
const inner = (svgText) => svgText.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")
const flower = (mode) => inner(brand.svg(brand.FINAL, mode, { background: false }))
write(
  out("..", "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="12.5 13.4 75 75">` +
    `<style>.d{display:none}@media (prefers-color-scheme:dark){.l{display:none}.d{display:inline}}</style>` +
    `<g class="l">${flower("light")}</g><g class="d">${flower("dark")}</g></svg>\n`,
)

// The outlines, read from the drawing's LOTUS paths and placed as the icon places them
// (lotus(): translate(0 -2), the right petal mirrored about x = 50; FV1 is drawn at scale 1).
const text = readFileSync(source, "utf8")
const block = text.match(/const LOTUS = \{([\s\S]*?)\n\};/)
if (!block) throw new Error("LOTUS paths not found in icon-glass.js")
const raw = Object.fromEntries([...block[1].matchAll(/(\w+): "([^"]+)"/g)].map((m) => [m[1], m[2]]))
const parse = (d, mirror) => {
  const nums = d.match(/-?\d+(\.\d+)?/g).map(Number)
  const pts = []
  for (let i = 0; i < nums.length; i += 2) pts.push([mirror ? 100 - nums[i] : nums[i], nums[i + 1] - 2])
  // M p0, then C c1 c2 p per segment
  const [start, ...rest] = pts
  const segs = []
  for (let i = 0; i < rest.length; i += 3) segs.push({ c1: rest[i], c2: rest[i + 1], p: rest[i + 2] })
  const r = (v) => Math.round(v * 100) / 100
  const f = ([x, y]) => `${r(x)} ${r(y)}`
  const path = `M${f(start)} ` + segs.map((s) => `C${f(s.c1)} ${f(s.c2)} ${f(s.p)}`).join(" ") + " Z"
  // Every point the outline passes through; the last one is the start again unless a straight edge closes it.
  const ends = segs.map((s) => s.p)
  const last = ends[ends.length - 1]
  const closes = last[0] === start[0] && last[1] === start[1]
  const anchors = [start, ...(closes ? ends.slice(0, -1) : ends)].map(([x, y]) => [r(x), r(y)])
  let prev = start
  const handles = segs.flatMap((s) => {
    const h = [[...prev, ...s.c1], [...s.p, ...s.c2]].map((v) => v.map(r))
    prev = s.p
    return h
  })
  return { d: path, anchors, handles }
}
const pieces = {
  "petal-left": parse(raw.side, false),
  "petal-right": parse(raw.side, true),
  bud: parse(raw.bud, false),
  leaf: parse(raw.leaf, false),
  base: parse(raw.base, false),
}
const ys = Object.values(pieces).flatMap((p) => p.d.match(/-?\d+(\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1))
const ts =
  `// Generated by scripts/export-lotus.mjs from the app's tools/brand/icon-glass.js. Do not edit.\n` +
  `// The five glass pieces of the Carden lotus on its 100 x 100 artboard: outline, anchors, handles.\n` +
  `export const lotusPieces = {\n${Object.entries(pieces).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n")}\n} as const\n\n` +
  `/** Path extremes, including control points (the drawn curve stays inside them). */\n` +
  `export const lotusBounds = ${JSON.stringify({ top: Math.min(...ys), bottom: Math.max(...ys) })} as const\n`
write(join(site, "src", "components", "site", "lotus-geometry.ts"), ts)
