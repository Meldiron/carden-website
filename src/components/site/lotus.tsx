import { useEffect, useRef, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { lotusPieces } from "@/components/site/lotus-geometry"
import { GlassPane } from "@/components/site/visuals"
import { cn } from "@/lib/utils"

// The Carden lotus: each of its pieces stands for part of the game. The stage shows it taken apart,
// as a construction drawing, or whole; below, every look iOS gives it. Everything is exported from
// the app's own drawing by scripts/export-lotus.mjs.

const meanings = [
  { piece: "The pink bud", text: "Today's picture, waiting to open.", swatch: "linear-gradient(150deg, #FF8FB5, #FF4F8B)" },
  { piece: "The gold petal", text: "The stars a finished picture earns.", swatch: "linear-gradient(150deg, #FFB91F, #C97400)" },
  { piece: "The blue petal", text: "The edge that joins pieces that belong together.", swatch: "linear-gradient(150deg, #8CCBFF, #2F86F2)" },
  { piece: "The two green cups", text: "The two taps that make every move.", swatch: "linear-gradient(180deg, #2EC4A0 50%, #16927E 50%)" },
]

export function Lotus() {
  return (
    <section id="lotus" className="relative scroll-mt-20 py-24">
      <GlassPane color="pink" className="right-[calc(50%-556px-340px)] -bottom-40 hidden h-[380px] w-[340px] -rotate-12 md:block" />
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-5">
        <div className="grid items-center gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col gap-9">
            <div className="flex max-w-md flex-col gap-4">
              <h2 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">Five pieces of glass</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">Our icon is a puzzle too. It only blooms once every piece fits.</p>
            </div>
            <ul className="flex max-w-md flex-col gap-5">
              {meanings.map((m) => (
                <li key={m.piece} className="flex items-center gap-4">
                  <span aria-hidden className="size-9 shrink-0 rounded-full shadow-sm ring-1 ring-black/10 dark:ring-white/15" style={{ background: m.swatch }} />
                  <span className="flex flex-col">
                    <span className="font-heading text-lg font-semibold">{m.piece}</span>
                    <span className="leading-relaxed text-muted-foreground">{m.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <IconStage />
        </div>
        <Looks />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// The stage: the pieces taken apart, the construction drawing, or the icon whole.

const views = [
  { id: "layers", label: "Layers", caption: "Five pieces, taken apart." },
  { id: "grid", label: "Grid", caption: "Every curve, with its anchors and handles." },
  { id: "icon", label: "Icon", caption: "Whole, as it sits on your Home Screen." },
] as const

function IconStage() {
  const [view, setView] = useState<(typeof views)[number]["id"]>("layers")
  return (
    <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="mx-auto w-full max-w-[480px] items-center gap-5">
      <div className="relative aspect-square w-full">
        {views.map((v) => (
          <TabsContent key={v.id} value={v.id} className="absolute inset-0 flex items-center justify-center">
            {v.id === "icon" && <IconView />}
            {v.id === "grid" && <GridView />}
            {v.id === "layers" && <LayersView />}
          </TabsContent>
        ))}
      </div>
      <TabsList aria-label="How to show the icon" className="frost h-10 rounded-full p-1 shadow-sm ring-1 ring-foreground/10">
        {views.map((v) => (
          <TabsTrigger key={v.id} value={v.id} className="rounded-full px-5 text-sm">
            {v.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <p aria-live="polite" className="text-center text-sm text-muted-foreground">
        {views.find((v) => v.id === view)?.caption}
      </p>
    </Tabs>
  )
}

/**
 * The icon whole, built from its five pieces over the ground (they composite exactly like the full
 * icon) so that one breeze can pass through it when the view opens: the bud sways most, the petals
 * follow a beat later, the cups barely move.
 */
const paintOrder = ["petal-left", "petal-right", "bud", "leaf", "base"] as const

function IconView() {
  return (
    <div className="lotus-breeze lifted relative aspect-square w-[74%]" role="img" aria-label="The Carden icon">
      <div className="absolute inset-0 rounded-[22.37%] bg-white ring-1 ring-black/5 dark:bg-[#0e0e11] dark:ring-white/10" />
      {paintOrder.map((f) => (
        <span key={f} data-piece={f} className="lotus-piece absolute inset-0">
          <img src={`/brand/layers/light/${f}.svg`} alt="" className="absolute inset-0 size-full dark:hidden" />
          <img src={`/brand/layers/dark/${f}.svg`} alt="" className="absolute inset-0 hidden size-full dark:block" />
        </span>
      ))}
    </div>
  )
}

/**
 * The construction drawing, in ink on drafting paper and nothing else: the 100-point artboard with
 * crop marks, the rounded square iOS cuts it to, guides through every anchor, the axis of symmetry,
 * the five outlines, and each curve's anchors and handles. It opens on the outlines alone, then the
 * drawing comes in around them in about a second (.gv-* in styles.css, delays in --d).
 */
function GridView() {
  const pieces = Object.values(lotusPieces)
  const anchors = pieces.flatMap((p) => p.anchors.map(([x, y]): [number, number] => [x, y]))
  const xs = [...new Set(anchors.map(([x]) => x))].filter((x) => x !== 50)
  const ys = [...new Set(anchors.map(([, y]) => y))]
  const hair = { vectorEffect: "non-scaling-stroke" as const }
  const ten = Array.from({ length: 11 }, (_, i) => i * 10)
  return (
    <div className="relative aspect-square w-[90%] overflow-hidden rounded-[28px] bg-card shadow-[0_24px_60px_-28px_rgb(20_22_50/0.35)] ring-1 ring-foreground/10 dark:bg-[#141419] dark:shadow-[0_24px_60px_-28px_rgb(0_0_0/0.8)]">
      <svg viewBox="-12 -12 124 124" className="absolute inset-0 size-full text-foreground" aria-hidden fill="none" stroke="currentColor">
        {/* Drafting paper: a ten-point grid. */}
        {ten.map((v) => (
          <g key={v} className="gv-fade" style={{ "--d": `${v * 2}ms` } as React.CSSProperties} strokeOpacity={v % 50 === 0 ? 0.1 : 0.05} strokeWidth={1}>
            <line x1={v} y1="-12" x2={v} y2="112" {...hair} />
            <line x1="-12" y1={v} x2="112" y2={v} {...hair} />
          </g>
        ))}
        {/* Crop marks at the artboard's corners. */}
        {[
          [0, 0, -1, -1],
          [100, 0, 1, -1],
          [0, 100, -1, 1],
          [100, 100, 1, 1],
        ].map(([x, y, dx, dy]) => (
          <path key={`${x}-${y}`} className="gv-fade" style={{ "--d": "120ms" } as React.CSSProperties} d={`M${x + dx * 3} ${y} h${dx * 6} M${x} ${y + dy * 3} v${dy * 6}`} strokeOpacity={0.55} strokeWidth={1} {...hair} />
        ))}
        {/* The artboard and the rounded square iOS cuts it to. */}
        <rect x="0" y="0" width="100" height="100" className="gv-draw" pathLength={1} style={{ "--d": "100ms" } as React.CSSProperties} strokeOpacity={0.3} strokeWidth={1} {...hair} />
        <rect x="0" y="0" width="100" height="100" rx="22.37" className="gv-fade" style={{ "--d": "300ms" } as React.CSSProperties} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="4 4" {...hair} />
        {/* Guides through every anchor, and the axis. */}
        <g strokeOpacity={0.14} strokeWidth={1}>
          {xs.map((x, i) => (
            <line key={`x${x}`} className="gv-grow" style={{ "--d": `${220 + i * 22}ms`, transformOrigin: `${x}px 0px` } as React.CSSProperties} x1={x} y1="0" x2={x} y2="100" {...hair} />
          ))}
          {ys.map((y, i) => (
            <line key={`y${y}`} className="gv-grow" style={{ "--d": `${220 + i * 22}ms`, transformOrigin: `0px ${y}px` } as React.CSSProperties} x1="0" y1={y} x2="100" y2={y} {...hair} />
          ))}
        </g>
        <line x1="50" y1="-6" x2="50" y2="106" className="gv-grow" style={{ "--d": "380ms", transformOrigin: "50px -6px" } as React.CSSProperties} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="8 3 1.5 3" {...hair} />
        {/* Handles, then the outlines over them. */}
        <g strokeOpacity={0.4} strokeWidth={1}>
          {pieces.flatMap((p, k) =>
            p.handles.map(([x1, y1, x2, y2], i) => (
              <line
                key={`${p.d}h${x1},${y1},${x2},${y2}`}
                className="gv-grow"
                style={{ "--d": `${520 + k * 60 + i * 12}ms`, transformOrigin: `${x1}px ${y1}px` } as React.CSSProperties}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                {...hair}
              />
            )),
          )}
        </g>
        {pieces.map((p) => (
          <path key={p.d} d={p.d} strokeWidth={1.6} strokeLinejoin="round" {...hair} />
        ))}
        {/* Control points (round) and anchors (square), hollow like a pen tool draws them. */}
        {pieces.flatMap((p, k) =>
          p.handles.map(([, , x, y], i) => (
            <circle
              key={`${p.d}c${x},${y}`}
              cx={x}
              cy={y}
              r="0.8"
              className="gv-pop fill-card dark:fill-[#141419]"
              style={{ "--d": `${700 + k * 60 + i * 12}ms` } as React.CSSProperties}
              strokeWidth={1}
              strokeOpacity={0.7}
              {...hair}
            />
          )),
        )}
        {anchors.map(([x, y], i) => (
          <rect
            key={`a${x},${y}`}
            x={x - 1}
            y={y - 1}
            width="2"
            height="2"
            className="gv-pop fill-card dark:fill-[#141419]"
            style={{ "--d": `${640 + i * 18}ms` } as React.CSSProperties}
            strokeWidth={1.2}
            {...hair}
          />
        ))}
      </svg>
    </div>
  )
}

/**
 * The pieces lifted off the ground in the order the flower grows, base cup first and the bud on top,
 * so the open stack reads from the bottom up like the lotus itself. It opens when it comes into view.
 */
const layers = [
  { id: "ground", files: [] },
  { id: "base", files: ["base"] },
  { id: "leaf", files: ["leaf"] },
  { id: "petals", files: ["petal-left", "petal-right"] },
  { id: "bud", files: ["bud"] },
] as const

function LayersView() {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setOpen(true), { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      data-open={open || undefined}
      className="lotus-layers relative aspect-square w-[66%]"
      role="img"
      aria-label="The lotus taken apart into its five glass pieces, stacked above the icon's ground"
    >
      <div className="lotus-stack absolute inset-0">
        {layers.map((l, i) => (
          <div key={l.id} className="lotus-layer absolute inset-0" style={{ "--i": i } as React.CSSProperties}>
            {l.id === "ground" ? (
              <div className="size-full rounded-[22.37%] bg-white shadow-xl ring-1 ring-black/10 dark:bg-[#0e0e11] dark:ring-white/15" />
            ) : (
              <>
                <div className="absolute inset-0 rounded-[22.37%] ring-1 ring-foreground/15" />
                {l.files.map((f) => (
                  <span key={f}>
                    <img src={`/brand/layers/light/${f}.svg`} alt="" className="absolute inset-0 size-full dark:hidden" />
                    <img src={`/brand/layers/dark/${f}.svg`} alt="" className="absolute inset-0 hidden size-full dark:block" />
                  </span>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Every look: the icon over a light and a dark Home Screen wallpaper.

const tints = [
  { id: "cobalt", name: "Cobalt", color: "#5B78E6" },
  { id: "rose", name: "Rose", color: "#E0567F" },
  { id: "amber", name: "Amber", color: "#D9952B" },
  { id: "sage", name: "Sage", color: "#4E9F7E" },
  { id: "plum", name: "Plum", color: "#8D63C9" },
] as const

function Looks() {
  const [tint, setTint] = useState<string>("cobalt")
  const tinted = (side: "light" | "dark") => `/brand/tints/${tint}-${side}.svg`
  const screens = [
    {
      side: "light" as const,
      wallpaper: "/covers/cherry-blossom.webp",
      icons: [
        { label: "Default", src: "/brand/looks/default.svg" },
        { label: "Clear", src: "/brand/looks/clear-light.svg", clear: true },
        { label: "Tinted", src: tinted("light") },
      ],
    },
    {
      side: "dark" as const,
      wallpaper: "/covers/nebulae.webp",
      icons: [
        { label: "Dark", src: "/brand/looks/dark.svg" },
        { label: "Clear", src: "/brand/looks/clear-dark.svg", clear: true },
        { label: "Tinted", src: tinted("dark") },
      ],
    },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex max-w-xl flex-col gap-2">
          <h3 className="text-2xl font-bold tracking-tight">On your Home Screen</h3>
          <p className="leading-relaxed text-muted-foreground">Default, dark, clear or tinted.</p>
        </div>
        <div className="flex items-center gap-3">
          <span id="tint-label" className="text-sm text-muted-foreground">
            Tint
          </span>
          <ToggleGroup aria-labelledby="tint-label" value={[tint]} onValueChange={(v: string[]) => v[0] && setTint(v[0])} spacing={1}>
            {tints.map((t) => (
              <ToggleGroupItem
                key={t.id}
                value={t.id}
                aria-label={t.name}
                className="size-9 min-w-0 rounded-full p-0 hover:bg-transparent aria-pressed:bg-transparent data-[state=on]:bg-transparent"
              >
                <span
                  className="size-6 rounded-full ring-offset-2 ring-offset-background transition-shadow group-aria-pressed/toggle:ring-2 group-aria-pressed/toggle:ring-foreground/70"
                  style={{ background: t.color }}
                />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {screens.map((s) => (
          <div key={s.side} className="relative isolate overflow-hidden rounded-[28px] px-6 py-9 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
            <div aria-hidden className="absolute inset-[-12%] -z-10 scale-110 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${s.wallpaper})` }} />
            <div aria-hidden className={cn("absolute inset-0 -z-10", s.side === "dark" ? "bg-black/45" : "bg-white/20")} />
            <ul className="flex justify-around gap-4">
              {s.icons.map((ic) => (
                <li key={ic.label} className="flex flex-col items-center gap-2.5">
                  <span
                    className={cn(
                      "block size-[72px] overflow-hidden rounded-[22.37%] shadow-[0_8px_20px_-6px_rgb(0_0_0/0.35)] sm:size-20",
                      ic.clear && (s.side === "dark" ? "bg-black/25 backdrop-blur-md" : "bg-white/25 backdrop-blur-md"),
                      ic.clear && "ring-1 ring-white/40",
                    )}
                  >
                    <img src={ic.src} alt={`The ${ic.label.toLowerCase()} icon in ${s.side} mode`} width={80} height={80} loading="lazy" className="size-full" />
                  </span>
                  <span className={cn("text-[13px] font-medium", s.side === "dark" ? "text-white" : "text-black/80")}>{ic.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
