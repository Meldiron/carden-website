import { useCallback, useEffect, useRef, useState } from "react"
import { UserPlusIcon } from "lucide-react"

import { avatars, type Avatar } from "@/components/site/avatars"
import boardInfo from "@/components/site/together-board.json"
import { ThemedImage } from "@/components/site/visuals"
import { cn } from "@/lib/utils"

// Play together, to play with: the app's player list (lib/features/coop/players_sheet.dart) in HTML, and
// the shared board from the store capture scene (`34_coop_clean`, Cards 7x7) with a cursor for every
// guest. Invite seats a new player (smallest free seat, its colour, a random name and avatar); Remove
// takes one out. Guests drift to another card now and then and sometimes hold it (an outline in their
// colour and their initial, as the app marks it). Reduced motion: cursors stay where they are.

const MAX_PLAYERS = 5
const NAMES = ["Ava", "Leo", "Noah", "Zoe", "Ivy", "Kai", "Nina", "Luca", "Ella", "Theo", "Maya", "Finn"]
const HOST = { name: "Mia", avatar: "fox" }
const START = [
  { name: "Ava", avatar: "flower" },
  { name: "Leo", avatar: "sun" },
]
const { cols, rows, locked } = boardInfo
const OPEN = Array.from({ length: cols * rows }, (_, i) => i).filter((i) => !locked.includes(i))

type Guest = {
  id: number
  name: string
  avatar: Avatar
  /** Seat 1 to 4: the app's player colours go round the seats after the host's (orange, purple, teal, pink). */
  seat: number
  cell: number
  /** Where in the card the pointer rests (fractions of the card), so cursors do not stack. */
  dx: number
  dy: number
  holding: boolean
  leaving: boolean
}

const avatarOf = (key: string) => avatars.find((a) => a.key === key) ?? avatars[0]
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

function freeCell(guests: Guest[], except?: number) {
  const taken = new Set(guests.filter((g) => g.id !== except).map((g) => g.cell))
  const open = OPEN.filter((c) => !taken.has(c))
  return pick(open.length ? open : OPEN)
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

/** A guest's pointer with their name, resting in a card of the board; the card they hold is outlined. */
function Cursor({ guest, still }: { guest: Guest; still: boolean }) {
  const c = guest.cell % cols
  const r = Math.floor(guest.cell / cols)
  // A held card shows the initial in its middle, so the pointer rests beside it, low on the card.
  const x = ((c + (guest.holding ? 0.68 : guest.dx)) / cols) * 100
  const y = ((r + (guest.holding ? 0.72 : guest.dy)) / rows) * 100
  // Near the right edge the name goes to the pointer's left, so it stays on the board.
  const tagLeft = c >= cols - 2
  const move = still ? "" : "transition-[left,top] duration-[1400ms] ease-in-out"
  return (
    <>
      {/* The held card: an outline just outside the card and the initial on it, in the guest's colour. */}
      <span
        aria-hidden
        className={cn("pointer-events-none absolute rounded-[3px] border-[2.5px] transition-opacity duration-300", guest.holding && !guest.leaving ? "opacity-100" : "opacity-0", still && "transition-none")}
        style={{ left: `${(c / cols) * 100}%`, top: `${(r / rows) * 100}%`, width: `${100 / cols}%`, height: `${100 / rows}%`, borderColor: `var(--player-${guest.seat})` }}
      >
        <Initial name={guest.name} seat={guest.seat} className="absolute top-1/2 left-1/2 size-[22px] -translate-1/2 text-[11.5px]" />
      </span>
      <span
        aria-hidden
        className={cn("pointer-events-none absolute z-10 transition-opacity duration-300", move, guest.leaving ? "opacity-0" : "opacity-100")}
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <svg viewBox="0 0 20 22" className="size-5 drop-shadow-[0_2px_3px_rgb(0_0_0/0.3)]">
          <path d="M2 1.5 L17 11 L10.2 12.3 L7 19.5 Z" style={{ fill: `var(--player-${guest.seat})` }} className="stroke-white stroke-[1.6] dark:stroke-[#111118]" strokeLinejoin="round" />
        </svg>
        <span
          className={cn(
            "absolute top-4 rounded-full px-2 py-0.5 text-[12px] leading-[1.35] font-semibold whitespace-nowrap shadow-[0_2px_6px_rgb(0_0_0/0.25)]",
            tagLeft ? "right-2" : "left-3.5",
          )}
          style={{ background: `var(--player-${guest.seat})`, color: `var(--on-player-${guest.seat})` }}
        >
          {guest.name}
        </span>
      </span>
    </>
  )
}

export function PlayTogetherDemo() {
  const still = usePrefersReducedMotion()
  const nextId = useRef(3)
  const [guests, setGuests] = useState<Guest[]>(() => [
    { id: 1, name: START[0].name, avatar: avatarOf(START[0].avatar), seat: 1, cell: OPEN[Math.floor(OPEN.length * 0.7)], dx: 0.55, dy: 0.5, holding: true, leaving: false },
    { id: 2, name: START[1].name, avatar: avatarOf(START[1].avatar), seat: 2, cell: OPEN[Math.floor(OPEN.length * 0.2)], dx: 0.4, dy: 0.6, holding: false, leaving: false },
  ])
  const [news, setNews] = useState("")
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const say = useCallback((text: string) => {
    setNews(text)
    setToast({ text, key: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  // Drift only while the board is on screen.
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Now and then one guest moves to another card, and sometimes picks it up.
  useEffect(() => {
    if (still || !visible) return
    const t = window.setInterval(() => {
      setGuests((gs) => {
        const live = gs.filter((g) => !g.leaving)
        if (!live.length) return gs
        const who = pick(live)
        return gs.map((g) => (g.id === who.id ? { ...g, cell: freeCell(gs, g.id), dx: 0.3 + Math.random() * 0.4, dy: 0.35 + Math.random() * 0.35, holding: Math.random() < 0.45 } : g))
      })
    }, 1700)
    return () => window.clearInterval(t)
  }, [still, visible])

  const live = guests.filter((g) => !g.leaving)
  const players = live.length + 1
  const full = players >= MAX_PLAYERS

  const invite = () => {
    if (full) return
    const seats = new Set(live.map((g) => g.seat))
    const seat = [1, 2, 3, 4].find((s) => !seats.has(s))!
    const names = NAMES.filter((n) => !live.some((g) => g.name === n) && n[0] !== HOST.name[0] && !live.some((g) => g.name[0] === n[0]))
    const name = pick(names.length ? names : NAMES.filter((n) => !live.some((g) => g.name === n)))
    const used = new Set([HOST.avatar, ...live.map((g) => g.avatar.key)])
    const avatar = pick(avatars.filter((a) => !used.has(a.key)))
    const id = nextId.current++
    setGuests((gs) => [...gs, { id, name, avatar, seat, cell: freeCell(gs), dx: 0.3 + Math.random() * 0.4, dy: 0.35 + Math.random() * 0.35, holding: false, leaving: false }])
    say(`${name} joined`)
  }

  const remove = (id: number) => {
    const g = guests.find((x) => x.id === id)
    if (!g) return
    setGuests((gs) => gs.map((x) => (x.id === id ? { ...x, leaving: true, holding: false } : x)))
    window.setTimeout(() => setGuests((gs) => gs.filter((x) => x.id !== id)), still ? 0 : 320)
    say(`${g.name} was removed`)
  }

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
        <div ref={boardRef} className="lifted-card relative overflow-hidden rounded-3xl bg-[#f6f6f8] p-3 dark:bg-[#0d0d10]">
          <div className="relative" role="img" aria-label={`The shared board: a lagoon in 49 cards, part of it in place, with ${players} players moving cards`}>
            <ThemedImage name="/boards/together" alt="" width={900} height={1200} className="block h-auto w-full" />
            {guests.map((g) => (
              <Cursor key={g.id} guest={g} still={still} />
            ))}
          </div>
          {toast && (
            <div
              key={toast.key}
              aria-hidden
              className="frost absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)] ring-1 ring-foreground/10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
            >
              {toast.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
