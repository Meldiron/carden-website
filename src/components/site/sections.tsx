import { useEffect, useRef, useState } from "react"
import { CloudIcon, EyeOffIcon, HourglassIcon, MapIcon, ShrinkIcon, Undo2Icon, ZoomInIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MiniBoard, type BoardPhase } from "@/components/site/mini-board"
import { GlassPane, Phone, ShapeGlyph, ThemedImage } from "@/components/site/visuals"
import { cn } from "@/lib/utils"

function Heading({ title, lead, className }: { title: string; lead?: string; className?: string }) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-4", className)}>
      <h2 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">{title}</h2>
      {lead && <p className="text-lg leading-relaxed text-muted-foreground">{lead}</p>}
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
    text: "Tap a card, then the place it belongs. Or drag it there.",
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
    text: "Cards that belong together snap into a group and move as one.",
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
    text: "A card in its true place locks. Finish in fewer moves for more stars.",
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
        <Heading title="Two taps make a move" lead="Take as long as you like. Every board saves as you go and waits for you to come back." />
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
                  <CardDescription className="text-base leading-relaxed">{s.text}</CardDescription>
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

export function Daily() {
  return (
    <section className="relative py-24">
      <GlassPane color="blue" className="top-24 -left-32 h-[560px] w-[460px] -rotate-12" />
      <GlassPane color="pink" className="-bottom-40 left-[calc(50%-556px-340px)] hidden h-[380px] w-[340px] rotate-6 md:block" />
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
            lead="Today's picture waits on Home. Solve it to keep your streak going, and catch up on any day you missed this month."
          />
          <ul className="flex flex-col gap-3 text-base text-muted-foreground">
            <li>Every daily picture of the current month is free.</li>
            <li>Earlier months stay in the Library, back to January 2023.</li>
            <li>A daily gift of coins, tickets and hints that grows through each week of your streak.</li>
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
  return (
    <section id="ways" className="relative scroll-mt-20 py-24">
      <GlassPane color="gold" className="-right-40 -bottom-48 hidden h-[640px] w-[480px] rotate-12 md:block" />
      <GlassPane color="gold" className="-right-24 bottom-[14%] h-[340px] w-[280px] rotate-12 md:hidden" />
      <Tabs defaultValue="triangles" orientation="vertical" className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-8">
          <Heading
            title="One picture, four ways to cut it"
            lead="Start with cards. Squares, triangles and hexagons open as you level up, and the trickier shapes pay a little more."
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
          {shapes.map((s) => (
            <TabsContent key={s.id} value={s.id}>
              <ThemedImage
                name={`/boards/${s.id}`}
                alt={`The Bora Bora lagoon cut into ${s.label.toLowerCase()}, about half of it in place`}
                width={900}
                height={1200}
                className="lifted-card mx-auto aspect-[3/4] w-full max-w-[460px] rounded-3xl object-cover"
              />
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
  return (
    <section className="relative py-24">
      <GlassPane color="pink" className="top-16 -left-36 h-[520px] w-[440px] -rotate-12 md:hidden" />
      <GlassPane color="teal" className="-bottom-44 -left-24 hidden h-[580px] w-[440px] -rotate-12 md:block" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="mx-auto w-full max-w-[340px]">
          <Phone name="painting" alt="Monet's chrysanthemums in Painting: a few cards in colour, the rest still grey" />
        </div>
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit">
            Opens at level 8
          </Badge>
          <Heading
            title="Bring the colour back"
            lead="Turn on Painting and every card starts in black and white. Each one takes its colour back as it locks, and the picture pays a quarter more."
          />
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------------------------
// Giant boards: the whole board in tiny cards, and the same board zoomed in with its map.

const giantTools = [
  { icon: ZoomInIcon, title: "Pinch to zoom", text: "Zoom in on one corner, or out to see the whole picture. It loads at full size, so every detail stays sharp." },
  { icon: MapIcon, title: "A map of the whole picture", text: "It shows where you are. With the map on, tap a card to see where it belongs." },
  { icon: ShrinkIcon, title: "Gather", text: "Brings loose cards into view, wherever you are on the board." },
]

export function Giant() {
  return (
    <section id="giant" className="relative scroll-mt-20 py-24">
      <GlassPane color="blue" className="-right-36 -bottom-48 hidden h-[680px] w-[500px] rotate-12 md:block" />
      <GlassPane color="blue" className="-right-24 bottom-[22%] h-[360px] w-[280px] rotate-12 md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-8">
          <Heading title="Giant boards" lead="Some pictures are made to last an evening: 100 to 300 cards, each one small enough to need a closer look." />
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
          <p className="text-sm text-muted-foreground">Opens at level 10. A giant pack can open it sooner for a few tickets.</p>
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
      <GlassPane color="pink" className="-bottom-56 left-[calc(50%-556px-320px)] hidden h-[300px] w-[320px] rotate-6 md:block" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-5">
        <Heading
          title="Thousands of pictures"
          lead="Wildlife, museum paintings, deep space, cities and quiet places, in more than 150 packs. Every picture is credited to its author."
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

export function OwnPhotos() {
  return (
    <section className="relative py-24">
      <GlassPane color="gold" className="-right-32 -bottom-48 hidden h-[640px] w-[460px] -rotate-12 md:block" />
      <GlassPane color="gold" className="-right-24 bottom-[18%] h-[380px] w-[300px] -rotate-12 md:hidden" />
      <GlassPane color="blue" className="-bottom-24 -left-28 h-[300px] w-[260px] rotate-12 md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="flex flex-col gap-6 md:order-1">
          <Heading
            title="Puzzle your own photos"
            lead="Add a photo from your library and play it like any other picture. Your photos are private: only your account can see them."
          />
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
      text: "Small goals that change every day and every week, each paying coins or tickets.",
      screen: "quests",
      alt: "The Quests tab with daily quests and one ready to claim",
    },
    {
      title: "Friends and the leaderboard",
      text: "Add friends with a code and see how your levels compare. The leaderboard is ranked by the experience you earn.",
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
          lead="Quests for every day and week, a pack for world days like World Food Day, open for a week, and friends to play alongside."
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
  { icon: EyeOffIcon, title: "No ad networks, no tracking", text: "Carden talks only to its own servers and to Apple. No third-party ads and no analytics." },
  { icon: HourglassIcon, title: "Play at your own pace", text: "Every board saves as you go. Close the game mid-puzzle and it opens where you left off." },
  { icon: Undo2Icon, title: "Help when you want it", text: "Undo is always free. Peek, Hint and Magic are there for a stubborn card." },
  { icon: CloudIcon, title: "One save, everywhere", text: "Sign in with Apple or with email, and your progress follows you between iPhone and browser." },
]

export function Calm() {
  return (
    <section className="relative py-28">
      <GlassPane color="gold" className="-bottom-56 left-[calc(50%-556px-380px)] hidden h-[420px] w-[380px] rotate-12 md:block" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-5">
        <Heading title="Made to be calm" />
        <div className="grid gap-x-16 gap-y-14 sm:grid-cols-2">
          {promises.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex flex-col gap-5 border-t border-border pt-8">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground" aria-hidden>
                <Icon className="size-7" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="max-w-md text-lg leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
