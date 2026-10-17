import { useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { UserPlusIcon } from "lucide-react"

import { avatars, type Avatar } from "@/components/site/avatars"
import { arrange, isGrouped, joinCount, PieceFace, seeded } from "@/components/site/puzzle-toy"
import boardInfo from "@/components/site/together-board.json"
import { cn } from "@/lib/utils"

// Play together, to play with: the app's player list (lib/features/coop/players_sheet.dart) in HTML, and the
// shared board of the store scene (the Bora Bora lagoon in Cards 7x7, its locked areas from the capture) built
// from card tiles like the page's other boards. Every guest plays on their own: now and then they pick up a loose
// card, drag it along a gentle arc to another loose card's place and the two swap, marked the way the app marks
// another player's card (an outline in their colour and their initial). A move never puts a card in its place and
// never joins a pair, so the board stays mid-game forever. Invite seats a new player (the next free seat's colour,
// a calm name, an avatar); Remove takes one out at once (a card in their hand glides back). Reduced motion: no
// moves, each guest's colour mark on one card.

const MAX_PLAYERS = 5
const NAMES = ["Ava", "Leo", "Noah", "Zoe", "Ivy", "Kai", "Nina", "Luca", "Ella", "Theo", "Finn", "Rosa"]
const HOST = { name: "Mia", avatar: "fox" }
const START = [
  { name: "Ava", avatar: "flower" },
  { name: "Leo", avatar: "sun" },
]
const COLS = 7
const ROWS = 7
const N = COLS * ROWS
const PICTURE = "/pictures/lagoon.webp"
// Three groups in the wrong spot (pieces joined to their true neighbour), as on the store scene's board.
const GROUPS: Record<number, number> = { 3: 33, 4: 34, 21: 12, 28: 19, 44: 9, 45: 10 }
const START_ORDER = arrange(N, COLS, { ...Object.fromEntries(boardInfo.locked.map((c) => [c, c])), ...GROUPS }, seeded(21))
// A moved card keeps its player's mark this long. The app keeps it 2.5 s; the page's players move faster than
// people do, so a shorter mark keeps five of them readable.
const MARK_MS = 1200
const SETTLE_MS = 380 // the displaced card's glide to the dragged card's old place

type Guest = {
  id: number
  name: string
  avatar: Avatar
  /** Seat 1 to 4: the app's player colours go round the seats after the host's (orange, purple, teal, pink). */
  seat: number
  /** This guest's own pace: how long one drag takes (ms). */
  drag: number
  /** The card this guest's mark sits on when nothing moves (reduced motion). */
  still: number
  leaving: boolean
}
type Drag = { guest: number; piece: number; other: number; from: number; to: number; anim: Animation | null; back: boolean }
type Engine = {
  order: number[]
  drags: Map<number, Drag>
  busyPieces: Set<number>
  busyCells: Set<number>
  /** Displaced cards gliding to the dragged card's old place (drawn above their neighbours). */
  settling: Set<number>
  marks: Map<number, { guest: number; until: number }>
  timers: Map<number, number>
}

const avatarOf = (key: string) => avatars.find((a) => a.key === key) ?? avatars[0]
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
const between = (a: number, b: number) => a + Math.random() * (b - a)
const at = (cell: number) => [(cell % COLS) * 100, Math.floor(cell / COLS) * 100] as const
const place = (cell: number, scale = 1) => `translate(${at(cell)[0]}%, ${at(cell)[1]}%) scale(${scale})`

/** Loose single cards (not in their place, not in a group): the only cards anyone moves. */
const movable = (order: number[]) => order.map((_, c) => c).filter((c) => order[c] !== c && !isGrouped(order, COLS, c))

/** A swap of two loose cards that puts neither in its place and joins no pair. */
function fair(order: number[], a: number, b: number) {
  if (order[a] === b || order[b] === a) return false
  const next = [...order]
  ;[next[a], next[b]] = [next[b], next[a]]
  return joinCount(next, COLS) === joinCount(order, COLS)
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(q.matches)
    const on = () => setReduce(q.matches)
    q.addEventListener("change", on)
    return () => q.removeEventListener("change", on)
  }, [])
  return reduce
}

/** The app's avatar: the symbol on its coloured disc. */
function AvatarDisc({ avatar, className }: { avatar: Avatar; className?: string }) {
  return (
    <span className={cn("flex items-center justify-center rounded-full", className)} style={{ background: avatar.color }} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-1/2 fill-white">
        <path d={avatar.path} />
      </svg>
    </span>
  )
}

/** The player's initial on their colour, with a thin ring in the card's colour (PlayerInitialBadge). */
function Initial({ name, seat, className }: { name: string; seat: number; className?: string }) {
  return (
    <span
      className={cn("flex items-center justify-center rounded-full font-bold leading-none ring-[1.5px] ring-card", className)}
      style={{ background: `var(--player-${seat})`, color: `var(--on-player-${seat})` }}
      aria-hidden
    >
      {name[0]}
    </span>
  )
}

function PlayerRow({ name, avatar, seat, status, onRemove, leaving }: { name: string; avatar: Avatar; seat: number; status: string; onRemove?: () => void; leaving?: boolean }) {
  return (
    <li
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
        leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
      )}
    >
      <div className="overflow-hidden">
        <div className="flex items-center gap-3.5 py-2.5 pr-2 pl-3">
          <span className="relative size-11 shrink-0">
            <span className="flex size-11 items-center justify-center rounded-full border-[2.5px] p-[2px]" style={{ borderColor: `var(--player-${seat})` }}>
              <AvatarDisc avatar={avatar} className="size-full" />
            </span>
            <Initial name={name} seat={seat} className="absolute -right-1 -bottom-1 size-5 text-[10.5px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[15px] font-semibold">{name}</span>
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <span className="size-[7px] shrink-0 rounded-full bg-[#16a34a]" aria-hidden />
              {status}
            </span>
          </span>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={leaving}
              aria-label={`Remove ${name}`}
              className="rounded-lg px-2.5 py-2 text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

export function PlayTogetherDemo() {
  const still = usePrefersReducedMotion()
  const nextId = useRef(3)
  const [guests, setGuests] = useState<Guest[]>(() => [
    { id: 1, name: START[0].name, avatar: avatarOf(START[0].avatar), seat: 1, drag: 1000, still: movable(START_ORDER)[4], leaving: false },
    { id: 2, name: START[1].name, avatar: avatarOf(START[1].avatar), seat: 2, drag: 850, still: movable(START_ORDER)[17], leaving: false },
  ])
  const guestsRef = useRef(guests)
  const [news, setNews] = useState("")
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const [, setTick] = useState(0)
  const bump = useCallback(() => setTick((t) => t + 1), [])
  const eng = useRef<Engine>({ order: [...START_ORDER], drags: new Map(), busyPieces: new Set(), busyCells: new Set(), settling: new Set(), marks: new Map(), timers: new Map() })
  const pieceEls = useRef(new Map<number, HTMLElement>())
  const boardRef = useRef<HTMLDivElement>(null)
  const visible = useRef(false)

  const setGuestList = useCallback((next: (gs: Guest[]) => Guest[]) => {
    guestsRef.current = next(guestsRef.current)
    setGuests(guestsRef.current)
  }, [])

  const say = useCallback((text: string) => {
    setNews(text)
    setToast({ text, key: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  // Moves happen only while the board is on screen.
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const io = new IntersectionObserver(([en]) => (visible.current = en.isIntersecting), { rootMargin: "80px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The move engine. Its state lives in a ref (several players change it between renders); `bump` re-renders.
  const engine = useRef<{ schedule: (id: number, delay: number) => void } | null>(null)
  if (!engine.current) {
    const isHere = (id: number) => guestsRef.current.some((g) => g.id === id && !g.leaving)

    const release = (d: Drag) => {
      const e = eng.current
      e.busyPieces.delete(d.piece)
      e.busyPieces.delete(d.other)
      e.busyCells.delete(d.from)
      e.busyCells.delete(d.to)
    }

    // One guest's loop: wait a while (their own pause), then drag a card if there is a fair move nobody else is
    // making; again and again, independently of the others.
    const schedule = (id: number, delay: number) => {
      const e = eng.current
      window.clearTimeout(e.timers.get(id))
      e.timers.set(
        id,
        window.setTimeout(() => {
          if (!isHere(id)) return
          if (!visible.current || document.hidden) return schedule(id, 700)
          if (!startDrag(id)) schedule(id, between(400, 900))
        }, delay),
      )
    }

    /** A card glided back to its place (its player left, or the move was taken back). */
    const finishBack = (d: Drag) => {
      const e = eng.current
      d.anim?.cancel()
      e.drags.delete(d.guest)
      release(d)
      e.marks.delete(d.piece)
      bump()
      if (isHere(d.guest)) schedule(d.guest, between(900, 2700))
    }

    /** The dragged card lands: the two cards swap places and both carry the player's mark for a moment. */
    const drop = (d: Drag) => {
      const e = eng.current
      // Another player's move may have landed meanwhile: a swap that would now join a pair is taken back.
      if (!fair(e.order, d.from, d.to)) {
        d.back = true
        d.anim?.reverse()
        return
      }
      ;[e.order[d.from], e.order[d.to]] = [e.order[d.to], e.order[d.from]]
      e.drags.delete(d.guest)
      const until = performance.now() + MARK_MS
      e.marks.set(d.piece, { guest: d.guest, until })
      e.marks.set(d.other, { guest: d.guest, until })
      e.settling.add(d.other)
      flushSync(bump)
      d.anim?.cancel()
      const settled = () => {
        e.settling.delete(d.other)
        release(d)
        bump()
      }
      const other = pieceEls.current.get(d.other)
      if (other) {
        other.animate([{ transform: place(d.to) }, { transform: place(d.from) }], { duration: SETTLE_MS, easing: "cubic-bezier(0.3, 0.7, 0.2, 1)" }).onfinish = settled
      } else settled()
      window.setTimeout(bump, MARK_MS + 30)
      // The next pick waits until this swap's marks have faded, so a player never holds a new card
      // while their last swap still shows.
      if (isHere(d.guest)) schedule(d.guest, between(MARK_MS + 100, 2700))
    }

    const startDrag = (id: number): boolean => {
      const e = eng.current
      const guest = guestsRef.current.find((g) => g.id === id)
      if (!guest) return false
      const free = movable(e.order).filter((c) => !e.busyCells.has(c) && !e.busyPieces.has(e.order[c]))
      if (free.length < 2) return false
      const from = pick(free)
      const targets = free.filter((c) => c !== from && fair(e.order, from, c))
      if (!targets.length) return false
      const to = pick(targets)
      const d: Drag = { guest: id, piece: e.order[from], other: e.order[to], from, to, anim: null, back: false }
      e.drags.set(id, d)
      e.busyPieces.add(d.piece).add(d.other)
      e.busyCells.add(from).add(to)
      e.marks.set(d.piece, { guest: id, until: Infinity })
      flushSync(bump)
      const el = pieceEls.current.get(d.piece)
      if (!el) {
        finishBack(d)
        return true
      }
      // A gentle arc: through a point beside the straight line, the card lifted on the way.
      const [ax, ay] = at(from)
      const [bx, by] = at(to)
      const len = Math.hypot(bx - ax, by - ay) || 1
      const bend = Math.min(len * 0.18, 70) * (Math.random() < 0.5 ? -1 : 1)
      const mx = (ax + bx) / 2 + (-(by - ay) / len) * bend
      const my = (ay + by) / 2 + ((bx - ax) / len) * bend
      const duration = guest.drag * between(0.85, 1.15) * Math.min(1.25, 0.75 + len / 600)
      d.anim = el.animate(
        [
          { transform: place(from, 1), offset: 0 },
          { transform: place(from, 1.12), offset: 0.14 },
          { transform: `translate(${mx}%, ${my}%) scale(1.12)`, offset: 0.55 },
          { transform: place(to, 1.12), offset: 0.88 },
          { transform: place(to, 1), offset: 1 },
        ],
        { duration, easing: "ease-in-out", fill: "forwards" },
      )
      d.anim.onfinish = () => (d.back ? finishBack(d) : drop(d))
      return true
    }

    engine.current = { schedule }
  }

  // The guests start one by one, each after a short random wait; nothing moves with reduced motion.
  useEffect(() => {
    if (still) return
    const e = eng.current
    for (const g of guestsRef.current) if (!g.leaving) engine.current?.schedule(g.id, between(300, 1500))
    return () => {
      e.timers.forEach((t) => window.clearTimeout(t))
      e.timers.clear()
    }
  }, [still])

  // Stop everything when the section goes away.
  useEffect(() => {
    const e = eng.current
    return () => {
      e.timers.forEach((t) => window.clearTimeout(t))
      e.drags.forEach((d) => d.anim?.cancel())
    }
  }, [])

  const live = guests.filter((g) => !g.leaving)
  const players = live.length + 1
  const full = players >= MAX_PLAYERS

  const invite = () => {
    if (full) return
    const seats = new Set(live.map((g) => g.seat))
    const seat = [1, 2, 3, 4].find((s) => !seats.has(s))!
    const names = NAMES.filter((n) => n[0] !== HOST.name[0] && !live.some((g) => g.name[0] === n[0]))
    const name = pick(names.length ? names : NAMES.filter((n) => !live.some((g) => g.name === n)))
    const used = new Set([HOST.avatar, ...live.map((g) => g.avatar.key)])
    const avatar = pick(avatars.filter((a) => !used.has(a.key)))
    const taken = new Set(live.map((g) => g.still))
    const id = nextId.current++
    const guest: Guest = { id, name, avatar, seat, drag: between(700, 1300), still: pick(movable(eng.current.order).filter((c) => !taken.has(c))), leaving: false }
    setGuestList((gs) => [...gs, guest])
    say(`${name} joined`)
    if (!still) engine.current?.schedule(id, between(300, 1200))
  }

  const remove = (id: number) => {
    const g = guests.find((x) => x.id === id)
    if (!g) return
    const e = eng.current
    window.clearTimeout(e.timers.get(id))
    e.timers.delete(id)
    setGuestList((gs) => gs.map((x) => (x.id === id ? { ...x, leaving: true } : x)))
    // A card in their hand glides back to its place.
    const d = e.drags.get(id)
    if (d && !d.back) {
      d.back = true
      d.anim?.reverse()
    }
    window.setTimeout(() => setGuestList((gs) => gs.filter((x) => x.id !== id)), still ? 0 : 320)
    say(`${g.name} was removed`)
  }

  // What each card shows: whose card it is right now (held, or just moved).
  const e = eng.current
  const now = typeof performance === "undefined" ? 0 : performance.now()
  const byId = new Map(live.map((g) => [g.id, g]))
  const markOf = new Map<number, Guest>()
  if (still) {
    for (const g of live) markOf.set(e.order[g.still], g)
  } else {
    e.marks.forEach((m, piece) => {
      const g = byId.get(m.guest)
      if (g && m.until > now) markOf.set(piece, g)
    })
  }
  const dragging = new Set([...e.drags.values()].filter((d) => !d.back).map((d) => d.piece))
  const cellOf = new Map(e.order.map((p, c) => [p, c]))

  const free = MAX_PLAYERS - players
  return (
    <div className="grid items-center gap-12 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-card p-4 shadow-[0_18px_40px_-24px_rgb(20_22_50/0.35)] ring-1 ring-foreground/10 sm:p-5">
          <div className="flex flex-col gap-0.5 px-1 pb-3">
            <h3 className="font-heading text-xl font-bold">Players</h3>
            <p className="text-sm text-muted-foreground">
              {players} of {MAX_PLAYERS} playing this board
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-border/80 rounded-2xl bg-muted/40" aria-label="Players">
            <PlayerRow name={HOST.name} avatar={avatarOf(HOST.avatar)} seat={0} status="Host · You" />
            {guests.map((g) => (
              <PlayerRow key={g.id} name={g.name} avatar={g.avatar} seat={g.seat} status="Here" onRemove={() => remove(g.id)} leaving={g.leaving} />
            ))}
          </ul>
          <div className="flex flex-col items-center gap-2 pt-4">
            <button
              type="button"
              onClick={invite}
              disabled={full}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-base font-semibold text-secondary-foreground transition-[background-color,opacity] hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground"
            >
              {!full && <UserPlusIcon className="size-5" aria-hidden />}
              {full ? "Up to 5 players" : "Invite"}
            </button>
            <p className="text-sm text-muted-foreground">
              {full ? "The board is full." : free === 1 ? "One more player can join." : `${free} more players can join.`}
            </p>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {news}
        </p>
      </div>
      <div className="relative mx-auto w-full max-w-[460px]">
        <div
          ref={boardRef}
          role="img"
          aria-label={`The shared board: a lagoon in 49 cards, part of it in place, with ${players} players moving cards`}
          className="toy-board coop-board"
          style={{ aspectRatio: `${COLS * 3} / ${ROWS * 4}` }}
        >
          {e.order.map((_, p) => {
            const c = cellOf.get(p) ?? p
            const mark = markOf.get(p)
            return (
              <div
                key={p}
                ref={(el) => {
                  if (el) pieceEls.current.set(p, el)
                  else pieceEls.current.delete(p)
                }}
                className="toy-piece coop-piece"
                data-locked={c === p || undefined}
                data-drag={dragging.has(p) || undefined}
                data-settle={e.settling.has(p) || undefined}
                style={{ width: `${100 / COLS}%`, height: `${100 / ROWS}%`, transform: place(c) }}
              >
                <span className="toy-lift">
                  <PieceFace order={e.order} cols={COLS} rows={ROWS} cell={c} picture={PICTURE} />
                  {mark && (
                    <span className="coop-mark" style={{ borderColor: `var(--player-${mark.seat})` }}>
                      <Initial name={mark.name} seat={mark.seat} className="coop-initial" />
                    </span>
                  )}
                </span>
              </div>
            )
          })}
          {toast && (
            <div
              key={toast.key}
              aria-hidden
              className="frost absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-foreground shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)] ring-1 ring-foreground/10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              {toast.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
