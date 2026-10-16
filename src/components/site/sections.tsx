import { useEffect, useRef, useState } from "react"
import {
  CalendarDaysIcon,
  CalendarPlusIcon,
  CalendarXIcon,
  CheckIcon,
  CloudIcon,
  EyeOffIcon,
  GiftIcon,
  HourglassIcon,
  LibraryBigIcon,
  MapIcon,
  ShrinkIcon,
  ShuffleIcon,
  Undo2Icon,
  WandSparklesIcon,
  ZoomInIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MiniBoard, type BoardPhase } from "@/components/site/mini-board"
import { giantStart, paintingStart, PuzzleBoard, usePuzzle } from "@/components/site/puzzle-toy"
import { StreakCard } from "@/components/site/streak"
import { GlassPane, Phone, ShapeGlyph, ThemedImage } from "@/components/site/visuals"
import { cn } from "@/lib/utils"

function Heading({ title, lead, className }: { title: string; lead?: string; className?: string }) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-4", className)}>
      <h2 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">{title}</h2>
      {lead && <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// How it plays: the three moves, in the order a first game goes.

// Each step plays on a small board cut from a real Carden picture. The shuffles follow the game's
// rules: no card starts in its true place and no two start joined.
const steps = [
  {
    title: "Swap two cards",
    text: "Tap a card, then the place it belongs. Or simply drag it over.",
    pane: "pink",
    board: {
      picture: "/covers/venice.webp",
      order: [5, 0, 3, 1, 6, 2, 8, 4, 7],
      swap: [0, 5],
      scene: "swap",
      freeze: 0.32,
      label: "A shuffled picture of a Venice palazzo. A card is tapped, then the place it belongs, and it locks there.",
    },
  },
  {
    title: "Join the pieces",
    text: "Cards that belong together join up, then glide around as one.",
    pane: "blue",
    board: {
      picture: "/covers/lighthouses.webp",
      order: [3, 0, 4, 1, 5, 8, 7, 6, 2],
      swap: [8, 4],
      joinLeft: 3,
      scene: "join",
      freeze: 0.9,
      label: "A shuffled picture of a lighthouse. A card moves next to its neighbour, and the two join into one group with a blue edge.",
    },
  },
  {
    title: "Lock the picture in",
    text: "A card in its place locks in. Fewer moves earn more stars.",
    pane: "gold",
    board: {
      picture: "/covers/sunflowers.webp",
      order: [0, 1, 6, 3, 4, 5, 2, 7, 8],
      swap: [6, 2],
      scene: "lock",
      freeze: 0.9,
      label: "A sunflower picture with two cards left. They swap, lock into place, and the finished picture earns three stars.",
    },
  },
] as const

// The boards take turns, one move after another, so the eye follows a single board at a time. The
// board that just played keeps its result through the next turn, and the one after that resets
// quietly (a short fade) while another board is playing, so it is ready when its turn comes. Turns
// run only while the steps are on screen. With reduced motion every board shows one still frame.
const TURN_MS = 2900
const FADE_MS = 300

function useTurns(count: number) {
  const ref = useRef<HTMLOListElement>(null)
  const [phases, setPhases] = useState<BoardPhase[]>(() => Array(count).fill("ready"))
  const [active, setActive] = useState(-1)
  const [visible, setVisible] = useState(false)
  const next = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!visible) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhases(Array(count).fill("play"))
      return
    }
    const fades: number[] = []
    const turn = () => {
      const k = next.current
      next.current = (k + 1) % count
      const last = (k + count - 1) % count
      setActive(k)
      setPhases((ph) => ph.map((p, i) => (i === k ? "play" : i === last ? (p === "play" ? "done" : p) : p === "ready" ? p : "resetting")))
      fades.push(window.setTimeout(() => setPhases((ph) => ph.map((p) => (p === "resetting" ? "ready" : p))), FADE_MS))
    }
    turn()
    const id = window.setInterval(turn, TURN_MS)
    return () => {
      window.clearInterval(id)
      fades.forEach((f) => window.clearTimeout(f))
    }
  }, [visible, count])
  return { ref, phases, active }
}

export function HowItPlays() {
  const { ref, phases, active } = useTurns(steps.length)
  return (
    <section id="how" className="relative scroll-mt-20 py-24">
      <GlassPane color="teal" className="right-[calc(50%-556px-360px)] -bottom-44 hidden h-[400px] w-[360px] rotate-12 md:block" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-5">
        <Heading title="Two taps make a move" lead="Take your time. Every board saves itself and waits for you." />
        <ol ref={ref} className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Card
                data-active={active === i || undefined}
                className="h-full pt-0 transition-[translate,box-shadow] duration-500 ease-out data-active:-translate-y-1.5 data-active:shadow-[0_22px_44px_-20px_rgb(47_79_191/0.45)] data-active:ring-brand/35"
              >
                <div className="step-sheen relative flex h-72 items-center justify-center overflow-hidden bg-muted/60">
                  <GlassPane color={s.pane} className="-top-10 -right-12 h-44 w-40 rotate-12 rounded-[36px]" />
                  <GlassPane color={i === 1 ? "teal" : i === 2 ? "pink" : "gold"} className="-bottom-14 -left-10 h-40 w-36 -rotate-12 rounded-[32px]" />
                  <MiniBoard {...s.board} phase={phases[i]} className="relative h-60" />
                </div>
                <CardHeader className="gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary font-heading text-lg font-bold text-secondary-foreground" aria-hidden>
                    {i + 1}
                  </span>
                  <CardTitle className="font-heading text-xl">{s.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-balance">{s.text}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// A new picture every day: the month calendar with the streak card lifted beside it.

const dailyPerks = [
  { icon: CalendarDaysIcon, text: "This month's pictures are free" },
  { icon: LibraryBigIcon, text: "Every month back to 2023 waits in the Library" },
  { icon: GiftIcon, text: "A daily gift that grows with your streak" },
]

export function Daily() {
  const [days, setDays] = useState(23)
  return (
    <section className="relative py-24">
      <GlassPane color="blue" className="top-24 -left-32 h-[560px] w-[460px] -rotate-12" />
      <GlassPane color="pink" className="-bottom-40 left-[calc(50%-556px-340px)] hidden h-[380px] w-[340px] rotate-6 md:block" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="relative mx-auto w-full max-w-[340px]">
          <Phone name="daily" alt="This month's daily pictures, with stars on the days already solved" />
          <StreakCard days={days} className="absolute -right-6 bottom-10 w-[108%] max-w-none sm:-right-16" />
        </div>
        <div className="flex flex-col gap-6">
          <Heading
            title="A new picture every day"
            lead="A fresh picture waits on Home each day. Missed one? Catch up any time this month."
          />
          <ul className="flex flex-col gap-3">
            {dailyPerks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5 text-base">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground" aria-hidden>
                  <Icon className="size-[18px]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-wrap gap-3">
              <Button size="xl" onClick={() => setDays((d) => d + 1)}>
                <CalendarPlusIcon data-icon="inline-start" />
                Add a day
              </Button>
              <Button size="xl" variant="secondary" onClick={() => setDays(0)} disabled={days === 0}>
                <CalendarXIcon data-icon="inline-start" />
                Miss a day
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {days === 0 ? "The streak starts again with today's picture." : `${days} days in a row. The gift grows through each week.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// One picture, four ways to cut it: the same lagoon as cards, squares, triangles and hexagons.

const shapes = [
  { id: "cards", label: "Cards", opens: "From the start", text: "Tall cards in a neat grid." },
  { id: "squares", label: "Squares", opens: "Level 2", text: "Even pieces, joined on every side." },
  { id: "triangles", label: "Triangles", opens: "Level 4", text: "Pieces that point up, then down." },
  { id: "hexagons", label: "Hexagons", opens: "Level 6", text: "Six sides each to join on." },
] as const

// A vertical tab list under the text picks the board on the right: each row names the shape, shows
// its tiling, and says when it opens. Arrow keys move between rows (Base UI Tabs).
// Switching shapes reveals the new board behind a diagonal sheet of light, right inside the frame: the
// new board's layer is wiped in over the old one (which stays beneath), and a band of light travels
// along the wipe. Nothing outside the frame moves, so the page scrolls as usual. Reduced motion: a switch.
type Shape = (typeof shapes)[number]["id"]

const REVEAL = { duration: 760, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }

function useShapeSwitch(initial: Shape) {
  const [shape, setShape] = useState<Shape>(initial)
  const [under, setUnder] = useState<Shape | null>(null)
  const layers = useRef(new Map<Shape, HTMLDivElement>())
  const sheen = useRef<HTMLSpanElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    layers.current
      .get(shape)
      ?.animate([{ clipPath: "polygon(0% 0%, 0% 0%, -36% 100%, -36% 100%)" }, { clipPath: "polygon(0% 0%, 136% 0%, 100% 100%, -36% 100%)" }], REVEAL)
    sheen.current?.animate(
      [
        { transform: "translateX(-130%) skewX(-18deg)", opacity: 1 },
        { opacity: 1, offset: 0.85 },
        { transform: "translateX(330%) skewX(-18deg)", opacity: 0 },
      ],
      REVEAL,
    )
  }, [shape])
  const pick = (next: Shape) => {
    if (next === shape) return
    setUnder(shape)
    setShape(next)
  }
  const layerRef = (id: Shape) => (el: HTMLDivElement | null) => {
    if (el) layers.current.set(id, el)
  }
  return { shape, under, pick, layerRef, sheen }
}

export function Ways() {
  const { shape, under, pick, layerRef, sheen } = useShapeSwitch("triangles")
  return (
    <section id="ways" className="relative scroll-mt-20 py-24">
      <GlassPane color="gold" className="-right-40 -bottom-48 hidden h-[640px] w-[480px] rotate-12 md:block" />
      <GlassPane color="gold" className="-right-24 bottom-[14%] h-[340px] w-[280px] rotate-12 md:hidden" />
      <Tabs value={shape} onValueChange={(v) => pick(v as Shape)} orientation="vertical" className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-8">
          <Heading
            title="One picture, four ways to cut it"
            lead="Start with cards. New shapes open as you level up, and the trickier ones pay a little more."
          />
          <TabsList aria-label="Board shapes" className="h-auto w-full max-w-md items-stretch gap-1 bg-transparent p-0">
            {shapes.map((s) => (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="group/shape h-auto items-start gap-4 rounded-2xl px-4 py-3.5 text-left whitespace-normal text-foreground hover:bg-foreground/[0.04] data-active:bg-card data-active:shadow-[0_10px_30px_-12px_rgb(20_22_50/0.25)] data-active:ring-1 data-active:ring-foreground/10 dark:data-active:border-transparent dark:data-active:bg-card"
              >
                <ShapeGlyph shape={s.id} className="mt-0.5 size-7 text-muted-foreground transition-colors group-data-active/shape:text-brand" />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-heading text-lg font-semibold">{s.label}</span>
                    <span className="text-sm font-normal text-muted-foreground">{s.opens}</span>
                  </span>
                  <span className="text-[0.95rem] leading-relaxed font-normal text-muted-foreground">{s.text}</span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div>
          {/* All four boards stay in one frame, so they load together; only the chosen one shows. */}
          <div aria-hidden className="lifted-card relative mx-auto aspect-[3/4] w-full max-w-[460px] rounded-3xl">
            <div className="absolute inset-0 overflow-hidden rounded-3xl bg-muted">
              {shapes.map((s) => (
                <div
                  key={s.id}
                  ref={layerRef(s.id)}
                  className={cn("absolute inset-0", s.id === shape ? "z-[2]" : s.id === under ? "z-[1]" : "opacity-0")}
                >
                  <ThemedImage name={`/boards/${s.id}`} alt="" width={900} height={1200} className="size-full object-cover" />
                </div>
              ))}
              <span ref={sheen} className="shape-sheen" />
            </div>
          </div>
          {shapes.map((s) => (
            <TabsContent key={s.id} value={s.id} className="sr-only">
              The Bora Bora lagoon cut into {s.label.toLowerCase()}, about half of it in place.
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Painting: every card starts grey and takes its colour back as it locks.

export function Painting() {
  const board = usePuzzle(4, 4, paintingStart)
  return (
    <section className="relative py-24">
      <GlassPane color="pink" className="top-16 -left-36 h-[520px] w-[440px] -rotate-12 md:hidden" />
      <GlassPane color="teal" className="-bottom-44 -left-24 hidden h-[580px] w-[440px] -rotate-12 md:block" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="mx-auto w-full max-w-[380px]">
          <PuzzleBoard
            picture="/pictures/monet.webp"
            cols={4}
            rows={4}
            painting
            {...board}
            onTap={board.tap}
            label="A Painting board of Monet's chrysanthemums: tap two cards to swap them"
          />
        </div>
        <div className="flex flex-col gap-6">
          <Heading title="Bring the colour back" lead="With Painting on, every card starts grey and gets its colour back as it locks." />
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Opens at level 8</Badge>
            <Badge variant="outline">25% colour bonus</Badge>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-wrap gap-3">
              <Button size="xl" onClick={() => board.solve()} disabled={board.solved}>
                <WandSparklesIcon data-icon="inline-start" />
                Solve three cards
              </Button>
              <Button size="xl" variant="secondary" onClick={board.reshuffle}>
                <ShuffleIcon data-icon="inline-start" />
                Shuffle
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {board.solved ? "Every card is back in colour." : `${board.locked} of ${board.total} cards in colour. Or tap two cards to swap them.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Giant boards: the whole board in tiny cards, and the same board zoomed in with its map.

const giantTools = [
  { icon: ZoomInIcon, title: "Pinch to zoom", text: "Get close. Every detail stays sharp." },
  { icon: MapIcon, title: "A map to find your way", text: "See where you are, and where a card belongs." },
  { icon: ShrinkIcon, title: "Gather", text: "Bring loose cards to where you are." },
]

export function Giant() {
  const board = usePuzzle(10, 10, giantStart)
  return (
    <section id="giant" className="relative scroll-mt-20 py-24">
      <GlassPane color="blue" className="-right-36 -bottom-48 hidden h-[680px] w-[500px] rotate-12 md:block" />
      <GlassPane color="blue" className="-right-24 bottom-[22%] h-[360px] w-[280px] rotate-12 md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-8">
          <Heading title="Giant boards" lead="For a long, slow evening: 100 to 300 cards in one picture." />
          <ul className="flex flex-col gap-5">
            {giantTools.map((t) => (
              <li key={t.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <t.icon className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">{t.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <Badge variant="secondary">Opens at level 10</Badge>
            or sooner, for a few tickets
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <Button size="xl" onClick={() => board.solve(10, 90)} disabled={board.solved}>
                <WandSparklesIcon data-icon="inline-start" />
                Solve ten cards
              </Button>
              <Button size="xl" variant="secondary" onClick={board.reshuffle}>
                <ShuffleIcon data-icon="inline-start" />
                Shuffle
              </Button>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {board.solved ? "The whole picture is in place." : `${board.locked} of ${board.total} cards in place. Or tap two cards to swap them.`}
            </p>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[500px] pb-24 sm:pb-28">
          <PuzzleBoard
            picture="/pictures/holderlin.webp"
            cols={10}
            rows={10}
            dense
            {...board}
            onTap={board.tap}
            label="A giant board of the Hölderlin Tower in Tübingen, a hundred cards: tap two cards to swap them"
          />
          <Phone
            name="giant-zoom"
            alt="A giant board in the game, zoomed in on a window, with the map of the whole picture in the corner"
            className="absolute -right-4 bottom-0 w-[38%] max-w-[190px] sm:-right-10"
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Thousands of pictures: one endless row of real pack covers.

const covers = [
  ["northern-lights", "Northern Lights"], ["tulip-fields", "Tulip Fields"], ["parrots", "Parrots"],
  ["hot-air-balloons", "Hot Air Balloons"], ["japanese-prints", "Japanese Prints"], ["cherry-blossom", "Cherry Blossom"],
  ["nebulae", "Nebulae"], ["kyoto", "Kyoto"], ["santorini", "Santorini"], ["lavender", "Lavender"],
  ["venice", "Venice"], ["sunflowers", "Sunflowers"], ["islands", "Islands"], ["hummingbirds", "Hummingbirds"],
  ["canyons", "Canyons"], ["fruit-markets", "Fruit Markets"], ["lighthouses", "Lighthouses"], ["frogs", "Frogs"],
  ["sushi", "Sushi"], ["tiles", "Tiles"],
] as const

export function Pictures() {
  const row = [...covers, ...covers]
  // The row moves sideways, and a lazy image only loads once it is on screen, so covers would slide in
  // blank. Load the whole row together when a reader gets near it instead.
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: "800px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section ref={ref} id="pictures" className="relative scroll-mt-20 py-24">
      <GlassPane color="pink" className="-bottom-56 left-[calc(50%-556px-320px)] hidden h-[300px] w-[320px] rotate-6 md:block" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-5">
        <Heading
          title="Thousands of pictures"
          lead="Wildlife, paintings, deep space and quiet places. More than 150 packs, every picture credited."
        />
      </div>
      <div className="marquee relative mt-14 overflow-hidden" role="region" aria-label="Some of the picture packs">
        <ul className="marquee-track flex w-max gap-5 px-5 py-6">
          {row.map(([id, name], i) => (
            <li key={`${id}-${i}`} aria-hidden={i >= covers.length} className="flex w-48 flex-col gap-2 sm:w-56">
              <img
                src={`/covers/${id}.webp`}
                alt={i < covers.length ? `${name} pack cover` : ""}
                width={480}
                height={640}
                loading={near ? "eager" : "lazy"}
                decoding="async"
                className="lifted-card aspect-[3/4] w-full rounded-2xl object-cover"
              />
              <span className="px-1 text-sm font-medium text-foreground/80">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Your own photos.

// The iPhone's photo picker (what Add photo opens), in iOS 26's look: Cancel and Add as glass pills, a
// tight square grid in select mode with three photos ticked (the ones in the My Puzzles capture beside
// it), and the count on a floating glass bar. It bleeds off the left edge of the page.
const library = [
  "covers/islands", "covers/canyons", "pictures/corgi", "covers/japanese-prints",
  "covers/cherry-blossom", "pictures/kitten", "covers/sushi", "covers/santorini",
  "covers/tulip-fields", "covers/lavender", "pictures/lighthouse", "covers/northern-lights",
  "covers/fruit-markets", "covers/hummingbirds", "covers/venice", "covers/frogs",
]
const chosen = ["pictures/corgi", "pictures/kitten", "pictures/lighthouse"]

function PhotoPicker() {
  return (
    <div
      role="img"
      aria-label="The iPhone photo picker in select mode, with a corgi, a kitten and a lighthouse chosen"
      className="photo-picker relative overflow-hidden rounded-r-[34px]"
    >
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <span className="picker-glass rounded-full px-4 py-1.5 text-[15px] font-medium">Cancel</span>
        <span className="flex flex-col items-center gap-1.5">
          <span className="text-[17px] font-semibold">Photos</span>
          <span className="picker-glass flex rounded-full p-0.5 text-[12px] font-medium">
            <span className="picker-seg rounded-full px-3 py-0.5">Photos</span>
            <span className="px-3 py-0.5 opacity-70">Collections</span>
          </span>
        </span>
        <span className="rounded-full bg-[#0071e3] px-4 py-1.5 text-[15px] font-semibold text-white">Add 3</span>
      </div>
      <ul className="grid grid-cols-4 gap-[2px]">
        {library.map((name) => (
          <li key={name} className="relative aspect-square overflow-hidden">
            <img src={`/${name}.webp`} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            {chosen.includes(name) && (
              <span className="absolute right-1.5 bottom-1.5 flex size-[22px] items-center justify-center rounded-full bg-[#0071e3] text-white ring-[1.5px] ring-white">
                <CheckIcon className="size-3.5" strokeWidth={3} />
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-gradient-to-t from-[var(--picker-bg)] to-transparent pb-4">
        <span className="picker-glass rounded-full px-5 py-2 text-[13px] font-semibold">3 photos selected</span>
      </div>
    </div>
  )
}

export function OwnPhotos() {
  return (
    <section className="relative py-24">
      <GlassPane color="gold" className="-right-32 -bottom-48 hidden h-[640px] w-[460px] -rotate-12 md:block" />
      <GlassPane color="gold" className="-right-24 bottom-[18%] h-[380px] w-[300px] -rotate-12 md:hidden" />
      <GlassPane color="blue" className="-bottom-24 -left-28 h-[300px] w-[260px] rotate-12 md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="flex flex-col gap-6 md:order-1">
          <Heading title="Puzzle your own photos" lead="Turn a favourite photo into a puzzle. It stays private, just for you." />
          <div className="picker-bleed mt-2 h-[30rem] sm:h-[34rem]">
            <PhotoPicker />
          </div>
          <p className="text-sm text-muted-foreground">Five photos are free; VIP adds as many as you like.</p>
        </div>
        <div className="relative mx-auto w-full max-w-[340px] md:order-2">
          <Phone name="my-puzzles" alt="My Puzzles with five photos: a corgi, a kitten, a lighthouse, a lagoon and macarons" />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Quests, events and friends.

export function Together() {
  const items = [
    {
      title: "Daily and weekly quests",
      text: "Little goals each day and week, with coins and tickets to collect.",
      screen: "quests",
      alt: "The Quests tab with daily quests and one ready to claim",
    },
    {
      title: "Friends and the leaderboard",
      text: "Add friends with a code and see how your levels compare.",
      screen: "friends",
      alt: "The leaderboard with the top three on a podium",
    },
  ]
  return (
    <section className="relative py-24">
      <GlassPane color="blue" className="-bottom-44 left-[calc(50%-556px-360px)] hidden h-[400px] w-[360px] rotate-12 md:block" />
      <GlassPane color="pink" className="bottom-[40%] -left-24 h-[360px] w-[280px] rotate-12 md:hidden" />
      <GlassPane color="teal" className="top-1/3 -right-36 hidden h-[480px] w-[400px] -rotate-12 md:block" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-5">
        <Heading
          title="Something to come back to"
          lead="Small goals for every day, special packs on world days, and friends to play alongside."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((it) => (
            <Card key={it.title} className="overflow-hidden pb-0">
              <CardHeader className="gap-2">
                <CardTitle className="font-heading text-2xl">{it.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{it.text}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex justify-center px-10 pt-4">
                <div className="h-[340px] w-full max-w-[300px] overflow-hidden">
                  <Phone name={it.screen} alt={it.alt} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Made to be calm: verifiable facts instead of ratings the game does not have yet.

const promises = [
  { icon: EyeOffIcon, title: "No tracking, no ad networks", text: "No analytics and no third-party ads. Just the game." },
  { icon: HourglassIcon, title: "Play at your own pace", text: "Close it mid-puzzle. It waits for you." },
  { icon: Undo2Icon, title: "Help when you want it", text: "Undo is always free. Hints help a stubborn card." },
  { icon: CloudIcon, title: "One save, everywhere", text: "One sign-in for iPhone and the web." },
]

export function Calm() {
  return (
    <section className="relative py-24">
      <GlassPane color="gold" className="-bottom-56 left-[calc(50%-556px-380px)] hidden h-[420px] w-[380px] rotate-12 md:block" />
      <div className="relative mx-auto max-w-6xl px-5">
        {/* The site's own glass: a soft cobalt-to-blush panel with lotus panes inside, the four promises on frosted tiles. */}
        <div className="relative isolate overflow-hidden rounded-[36px] bg-[linear-gradient(160deg,#e9eefb,#f7f8fd_55%,#fbeef4)] px-5 py-12 shadow-xl ring-1 ring-black/5 sm:px-12 sm:py-16 dark:bg-[linear-gradient(160deg,#141a38,#0f1224_55%,#1d1022)] dark:ring-white/10">
          <GlassPane color="blue" className="-top-24 -right-16 hidden h-[340px] w-[300px] rotate-12 sm:block" />
          <GlassPane color="pink" className="-bottom-28 left-[22%] h-[300px] w-[280px] -rotate-6" />
          <GlassPane color="gold" className="top-[30%] -left-28 hidden h-[280px] w-[240px] -rotate-12 sm:block" />
          <GlassPane color="teal" className="right-[24%] -bottom-32 hidden h-[260px] w-[240px] rotate-6 lg:block" />
          <div className="relative flex max-w-xl flex-col gap-3">
            <h2 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">Made to be calm</h2>
            <p className="text-lg leading-relaxed text-foreground/80">No rush, no noise, nothing watching.</p>
          </div>
          <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {promises.map(({ icon: Icon, title, text }) => (
              <div key={title} className="frost-tile flex flex-col gap-4 rounded-3xl p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/80 text-brand dark:bg-white/10" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xl leading-snug font-semibold">{title}</h3>
                  <p className="text-[15px] leading-relaxed text-balance text-black/70 dark:text-white/75">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
