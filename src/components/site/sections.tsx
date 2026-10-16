import { useEffect, useRef, useState } from "react"
import {
  CalendarDaysIcon,
  CloudIcon,
  EyeOffIcon,
  GiftIcon,
  HourglassIcon,
  ImagePlusIcon,
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
import { PuzzleBoard, usePuzzle } from "@/components/site/puzzle-toy"
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
    text: "Tap a card, then the place it belongs.",
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
    text: "Cards that fit join up and move as one.",
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
      <GlassPane color="gold" className="top-185 right-[calc(50%+20px)] hidden h-[880px] w-[720px] rotate-8 md:block" />
      <GlassPane color="pink" className="top-180 left-[calc(50%+60px)] hidden h-[290px] w-[800px] -rotate-6 rounded-[44px] md:block" />
      <GlassPane color="gold" className="bottom-[-630px] left-[calc(50%-260px)] h-[700px] w-[440px] rotate-8 md:hidden" />
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
  return (
    <section className="relative py-24">
      <GlassPane color="teal" className="left-[calc(50%+50px)] hidden h-[900px] w-[640px] rotate-10 md:-bottom-180 md:block lg:bottom-[-670px]" />
      <GlassPane color="blue" className="right-[calc(50%+40px)] bottom-[-50px] hidden h-[520px] w-[560px] -rotate-9 md:block" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="relative mx-auto w-full max-w-[340px]">
          <Phone name="daily" alt="This month's daily pictures, with stars on the days already solved" />
          <ThemedImage
            name="/cards/streak"
            alt="A 23-day streak on the Home screen"
            width={1200}
            height={512}
            className="lifted-card absolute -right-6 bottom-10 w-[108%] max-w-none rounded-2xl sm:-right-16"
          />
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
export function Ways() {
  const [shape, setShape] = useState<(typeof shapes)[number]["id"]>("triangles")
  return (
    <section id="ways" className="relative scroll-mt-20 py-24">
      <GlassPane color="pink" className="right-[calc(50%+30px)] hidden h-[700px] w-[700px] rotate-10 md:bottom-[-670px] md:block lg:top-186" />
      <GlassPane color="gold" className="left-[calc(50%+80px)] hidden h-[560px] w-[600px] rotate-8 md:-bottom-20 md:block lg:bottom-[-170px]" />
      <GlassPane color="pink" className="bottom-[-330px] left-[calc(50%-230px)] h-[760px] w-[460px] -rotate-10 md:hidden" />
      <Tabs value={shape} onValueChange={(v) => setShape(v as typeof shape)} orientation="vertical" className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[0.9fr_1.1fr]">
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
          {/* All four boards stay in one frame, so they load together; the chosen one comes into focus. */}
          <div aria-hidden className="lifted-card relative mx-auto aspect-[3/4] w-full max-w-[460px] overflow-hidden rounded-3xl bg-muted">
            {shapes.map((s) => (
              <div key={s.id} data-active={shape === s.id || undefined} className="morph-layer absolute inset-0">
                <ThemedImage name={`/boards/${s.id}`} alt="" width={900} height={1200} className="size-full object-cover" />
              </div>
            ))}
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
  const board = usePuzzle(4, 4, 11)
  return (
    <section className="relative py-24">
      <GlassPane color="blue" className="left-[calc(50%+40px)] hidden h-[940px] w-[660px] -rotate-10 md:bottom-[-835px] md:block lg:-bottom-193" />
      <GlassPane color="teal" className="right-[calc(50%+40px)] hidden h-[560px] w-[620px] rotate-9 md:bottom-[-150px] md:block lg:-bottom-55" />
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
            <Badge variant="outline">Pays 25% more</Badge>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex flex-wrap gap-3">
              <Button size="xl" onClick={() => board.solve(3)} disabled={board.solved}>
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
  return (
    <section id="giant" className="relative scroll-mt-20 py-24">
      <GlassPane color="gold" className="hidden h-[860px] w-[640px] -rotate-8 md:-bottom-50 md:left-[calc(50%+220px)] md:block lg:bottom-[-270px] lg:left-[calc(50%+80px)]" />
      <GlassPane color="pink" className="right-[calc(50%+100px)] hidden w-[760px] -rotate-5 rounded-[44px] md:-bottom-20 md:block md:h-[240px] lg:-bottom-15 lg:h-[260px]" />
      <GlassPane color="teal" className="top-140 -right-25 h-[420px] w-[320px] -rotate-10 md:hidden" />
      <GlassPane color="gold" className="-bottom-12 left-[calc(50%-180px)] h-[620px] w-[440px] rotate-10 md:hidden" />
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
        </div>
        <div className="relative mx-auto h-[600px] w-full max-w-[520px] sm:h-[760px]">
          <Phone
            name="giant-board"
            alt="A giant board of colourful houses in tiny cards, only a small part solved"
            className="absolute top-0 left-0 w-[58%] max-w-[290px]"
          />
          <Phone
            name="giant-zoom"
            alt="The same giant board zoomed in on a window, with the map of the whole picture in the corner"
            className="absolute right-0 bottom-0 w-[58%] max-w-[290px]"
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
      <GlassPane color="teal" className="-bottom-199 left-[calc(50%+60px)] hidden h-[860px] w-[640px] -rotate-8 md:block" />
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

/** Cuts a chosen photo to the board's 3:4 shape in the browser; nothing leaves the page. */
async function boardPicture(file: File) {
  const bitmap = await createImageBitmap(file)
  const h = Math.min(bitmap.height, (bitmap.width * 4) / 3)
  const w = (h * 3) / 4
  const canvas = document.createElement("canvas")
  canvas.width = Math.min(900, Math.round(w))
  canvas.height = Math.round((canvas.width * 4) / 3)
  canvas.getContext("2d")?.drawImage(bitmap, (bitmap.width - w) / 2, (bitmap.height - h) / 2, w, h, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL("image/jpeg", 0.88)
}

export function OwnPhotos() {
  const board = usePuzzle(3, 3, 5)
  const [picture, setPicture] = useState("/pictures/corgi.webp")
  const input = useRef<HTMLInputElement>(null)
  const choose = async (file?: File) => {
    if (!file) return
    setPicture(await boardPicture(file))
    board.reshuffle()
  }
  return (
    <section className="relative py-24">
      <GlassPane color="gold" className="-top-23 left-[calc(50%-556px-440px-50px)] hidden h-[1100px] w-[440px] rotate-4 lg:block" />
      <GlassPane color="pink" className="hidden h-[860px] w-[640px] rotate-10 md:-bottom-20 md:left-[calc(50%+240px)] md:block lg:bottom-[-230px] lg:left-[calc(50%+160px)]" />
      <GlassPane color="pink" className="bottom-[-50px] left-[calc(50%-220px)] h-[600px] w-[440px] -rotate-9 md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="flex flex-col gap-6 md:order-1">
          <Heading
            title="Puzzle your own photos"
            lead="Turn a favourite photo into a puzzle. It stays private, just for you."
          />
          <div className="mt-2 flex items-center gap-6">
            <PuzzleBoard
              picture={picture}
              cols={3}
              rows={3}
              {...board}
              onTap={board.tap}
              label="A small puzzle of your photo: tap two cards to swap them"
              className="w-40 shrink-0 sm:w-48"
            />
            <div className="flex flex-col items-start gap-3">
              <p className="text-base font-medium">Try one of yours</p>
              <Button size="xl" onClick={() => input.current?.click()}>
                <ImagePlusIcon data-icon="inline-start" />
                Choose a photo
              </Button>
              <p className="text-sm text-muted-foreground">It stays on this page. Nothing is uploaded.</p>
              <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => choose(e.target.files?.[0])} />
            </div>
          </div>
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
      <GlassPane color="blue" className="left-[calc(50%+60px)] hidden h-[760px] w-[620px] rotate-10 md:-bottom-115 md:block lg:-bottom-140" />
      <GlassPane color="teal" className="right-[calc(50%+100px)] hidden h-[260px] w-[740px] rotate-6 rounded-[44px] md:-bottom-10 md:block lg:bottom-[-110px]" />
      <GlassPane color="blue" className="-bottom-13 left-[calc(50%-220px)] h-[360px] w-[440px] rotate-8 md:hidden" />
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
      <GlassPane color="teal" className="right-[calc(50%+40px)] bottom-[-789px] hidden h-[900px] w-[680px] -rotate-10 md:block" />
      <GlassPane color="blue" className="-bottom-65 left-[calc(50%+60px)] hidden h-[360px] w-[800px] rotate-6 md:block" />
      <GlassPane color="teal" className="-bottom-140 left-[calc(50%-200px)] h-[640px] w-[440px] rotate-9 md:hidden" />
      <div className="relative mx-auto max-w-6xl px-5">
        {/* A quiet field of lavender, softly out of focus, with the four promises on frosted glass. */}
        <div className="relative isolate overflow-hidden rounded-[36px] px-5 py-12 shadow-xl sm:px-12 sm:py-16">
          <img src="/covers/lavender.webp" alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-10 size-full scale-125 object-cover blur-2xl" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(20_16_40/0.66),rgb(20_16_40/0.22)_55%,rgb(20_16_40/0.4))] dark:bg-[linear-gradient(180deg,rgb(8_6_18/0.75),rgb(8_6_18/0.45)_55%,rgb(8_6_18/0.7))]" />
          <div className="flex max-w-xl flex-col gap-3">
            <h2 className="text-4xl leading-[1.08] font-bold tracking-tight text-white sm:text-5xl">Made to be calm</h2>
            <p className="text-lg leading-relaxed text-white/90">No rush, no noise, nothing watching.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
