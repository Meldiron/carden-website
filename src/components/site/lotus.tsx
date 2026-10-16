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
  { piece: "The blue petal", text: "The edge that joins pieces together.", swatch: "linear-gradient(150deg, #8CCBFF, #2F86F2)" },
  { piece: "The two green cups", text: "The two taps that make every move.", swatch: "linear-gradient(180deg, #2EC4A0 50%, #16927E 50%)" },
]

export function Lotus() {
  return (
    <section id="lotus" className="relative scroll-mt-20 py-24">
      <GlassPane color="gold" className="-bottom-90 left-[calc(50%-556px-424px)] hidden h-[760px] w-[440px] rotate-10 lg:block" />
      <GlassPane color="pink" className="right-[calc(50%-556px-416px)] -bottom-75 hidden h-[700px] w-[440px] -rotate-8 lg:block" />
      <GlassPane color="teal" className="top-[565px] left-[calc(50%-210px)] h-[300px] w-[420px] rotate-6 md:hidden" />
      <GlassPane color="gold" className="-bottom-26 left-[calc(50%-210px)] h-[214px] w-[420px] -rotate-6 rounded-[44px] md:hidden" />
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-5">
        <div className="grid items-center gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col gap-9">
            <div className="flex max-w-md flex-col gap-4">
              <h2 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">Five pieces of glass</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">Our icon is a puzzle too. It blooms once every piece fits.</p>
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
// On your Home Screen: an iPad-like Home Screen over a glass wallpaper in the manner of iOS 26 (our own
// drawing, public/brand/wallpaper-*.svg; light on the light page, dark on the dark page) with the Daily widget in all three sizes, a tint control, and a dock holding every
// look of the icon. The widget follows the app's DailyWidget (ios/DailyWidget): the picture edge to
// edge, a dark fade at the bottom, "TODAY", the title and, on the larger two, "Tap to play".

const tints = [
  { id: "cobalt", name: "Cobalt", color: "#5B78E6" },
  { id: "rose", name: "Rose", color: "#E0567F" },
  { id: "amber", name: "Amber", color: "#D9952B" },
  { id: "sage", name: "Sage", color: "#4E9F7E" },
  { id: "plum", name: "Plum", color: "#8D63C9" },
  { id: "graphite", name: "Graphite", color: "#6B7280" },
] as const

type WidgetSize = "small" | "medium" | "large"

// Three daily pictures, one per widget size (public domain or CC0, see prepare-assets.py).
const widgetPicture: Record<WidgetSize, { src: string; title: string }> = {
  large: { src: "/pictures/lorikeet.webp", title: "Rainbow lorikeet" },
  medium: { src: "/pictures/primrose.webp", title: "Primrose" },
  small: { src: "/pictures/barn.webp", title: "Barn Window" },
}

function DailyWidget({ size, className }: { size: WidgetSize; className?: string }) {
  const picture = widgetPicture[size]
  const title = { small: "text-[15px]", medium: "text-[18px]", large: "text-[22px]" }[size]
  return (
    <div
      role="img"
      aria-label={`The Daily puzzle widget, ${size}: ${picture.title}`}
      className={cn("relative isolate overflow-hidden rounded-[22px] shadow-[0_12px_30px_-10px_rgb(0_0_0/0.45)]", className)}
    >
      <img src={picture.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-10 size-full object-cover" />
      {/* The app's fade (clear from 35% to black 78%), a little deeper behind the words so they read on a bright sky. */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent_22%,rgb(0_0_0/0.6)_54%,rgb(0_0_0/0.86))]" />
      <div className="flex size-full flex-col justify-end gap-0.5 p-4 leading-tight text-white">
        <span className="text-[10px] font-bold tracking-[0.08em] text-white/90">TODAY</span>
        <span className={cn(title, "font-bold")}>{picture.title}</span>
        {size !== "small" && <span className="pt-0.5 text-xs font-semibold text-white/80">Tap to play</span>}
      </div>
    </div>
  )
}

function Looks() {
  const [tint, setTint] = useState<string>("cobalt")
  const icons = [
    { label: "Default", src: "/brand/looks/default.svg" },
    { label: "Dark", src: "/brand/looks/dark.svg" },
    { label: "Clear", src: "/brand/looks/clear-light.svg", clear: "light" },
    { label: "Clear dark", src: "/brand/looks/clear-dark.svg", clear: "dark" },
    { label: "Tinted", src: `/brand/tints/${tint}-light.svg` },
    { label: "Tinted dark", src: `/brand/tints/${tint}-dark.svg` },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-xl flex-col gap-2">
        <h3 className="text-2xl font-bold tracking-tight">On your Home Screen</h3>
        <p className="leading-relaxed text-muted-foreground">The daily picture in a widget, and the icon in every look.</p>
      </div>
      <div className="relative isolate overflow-hidden rounded-[36px] px-5 py-8 shadow-xl ring-1 ring-black/5 sm:px-10 sm:py-12 dark:ring-white/10">
        <div aria-hidden className="wallpaper absolute inset-[-15%] -z-10" />
        <div className="mx-auto flex w-fit flex-col gap-8">
          <div className="flex flex-col gap-6 md:flex-row md:gap-10">
            <DailyWidget size="large" className="order-3 aspect-square w-full max-w-[328px] md:order-none md:w-[328px]" />
            <div className="flex flex-col gap-6">
              <DailyWidget size="medium" className="aspect-[328/152] w-full max-w-[328px] md:w-[328px]" />
              <div className="flex gap-6">
                <DailyWidget size="small" className="aspect-square w-[calc(50%-12px)] max-w-[152px] md:w-[152px]" />
                <div className="frost-tile flex aspect-square w-[calc(50%-12px)] max-w-[152px] flex-col justify-between rounded-[22px] p-4 md:w-[152px]">
                  <span id="tint-label" className="text-[13px] font-semibold">
                    Icon tint
                  </span>
                  <ToggleGroup aria-labelledby="tint-label" value={[tint]} onValueChange={(v: string[]) => v[0] && setTint(v[0])} spacing={1} className="flex-wrap gap-1.5">
                    {tints.map((t) => (
                      <ToggleGroupItem
                        key={t.id}
                        value={t.id}
                        aria-label={t.name}
                        className="size-8 min-w-0 rounded-full p-0 hover:bg-transparent aria-pressed:bg-transparent data-[state=on]:bg-transparent"
                      >
                        <span
                          className="size-6 rounded-full ring-white/90 ring-offset-0 transition-shadow group-aria-pressed/toggle:ring-[3px]"
                          style={{ background: t.color }}
                        />
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </div>
          <ul aria-label="Every look of the Carden icon" className="frost-tile grid grid-cols-3 justify-items-center gap-x-4 gap-y-4 rounded-[30px] px-4 py-4 sm:grid-cols-6 sm:gap-x-5">
            {icons.map((ic) => (
              <li key={ic.label} className="flex w-16 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "block size-14 overflow-hidden rounded-[22.37%] shadow-[0_6px_16px_-6px_rgb(0_0_0/0.4)] sm:size-16",
                    ic.clear === "light" && "bg-white/30 ring-1 ring-white/50 backdrop-blur-md",
                    ic.clear === "dark" && "bg-black/30 ring-1 ring-white/25 backdrop-blur-md",
                  )}
                >
                  <img src={ic.src} alt={`The ${ic.label.toLowerCase()} icon`} width={64} height={64} loading="lazy" className="size-full" />
                </span>
                <span className="text-center text-[12px] leading-tight font-medium whitespace-nowrap">{ic.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
