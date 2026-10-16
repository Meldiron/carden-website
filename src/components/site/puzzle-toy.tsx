import { useCallback, useEffect, useRef, useState } from "react"
import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// A small playable board, drawn the way the game draws its board (.toy-* in styles.css): tap a card,
// then another, and they swap; a card in its true place locks. In Painting, loose cards are grey and
// each one takes its colour back as it locks.

/** A seeded random source, so the first shuffle is the same on the prerendered page and in the browser. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Two neighbouring cells that hold neighbouring pieces in the same order are joined. */
function hasJoined(order: number[], cols: number) {
  return order.some((p, c) => {
    const right = c % cols < cols - 1 && p % cols < cols - 1 && order[c + 1] === p + 1
    const below = c + cols < order.length && order[c + cols] === p + cols
    return right || below
  })
}

/** The game's shuffle: no card in its place and no two cards joined. */
function shuffle(n: number, cols: number, random: () => number) {
  for (;;) {
    const order = Array.from({ length: n }, (_, i) => i)
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    if (order.every((p, c) => p !== c) && !hasJoined(order, cols)) return order
  }
}

export function usePuzzle(cols: number, rows: number, seed = 7) {
  const n = cols * rows
  const [order, setOrder] = useState(() => shuffle(n, cols, seeded(seed)))
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const timers = useRef<number[]>([])
  const stop = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => stop, [])

  const tap = useCallback(
    (cell: number) => {
      if (order[cell] === cell) return
      if (selected === null) return setSelected(cell)
      if (selected === cell) return setSelected(null)
      const a = selected
      setOrder((o) => {
        const q = [...o]
        ;[q[a], q[cell]] = [q[cell], q[a]]
        return q
      })
      setSelected(null)
      setMoves((m) => m + 1)
    },
    [order, selected],
  )

  const reshuffle = useCallback(() => {
    stop()
    setSelected(null)
    setMoves(0)
    setOrder(shuffle(n, cols, Math.random))
  }, [n, cols])

  /** Puts up to `count` cards in their places, one after another, growing from the cards already locked. */
  const solve = useCallback(
    (count = 3) => {
      stop()
      setSelected(null)
      const plan: number[][] = []
      let o = order
      for (let k = 0; k < count; k++) {
        const loose = o.map((_, c) => c).filter((c) => o[c] !== c)
        if (!loose.length) break
        const near = (home: number) =>
          [home - cols, home + cols, home % cols ? home - 1 : -1, home % cols < cols - 1 ? home + 1 : -1].filter((h) => h >= 0 && h < n && o[h] === h).length
        const best = Math.max(...loose.map((c) => near(o[c])))
        const pick = loose.filter((c) => near(o[c]) === best)
        const c = pick[Math.floor(Math.random() * pick.length)]
        const piece = o[c]
        const q = [...o]
        ;[q[c], q[piece]] = [q[piece], q[c]]
        plan.push(q)
        o = q
      }
      plan.forEach((next, k) =>
        timers.current.push(
          window.setTimeout(() => {
            setOrder(next)
            setMoves((m) => m + 1)
          }, k * 300),
        ),
      )
    },
    [order, cols, n],
  )

  const locked = order.filter((p, c) => p === c).length
  return { order, selected, tap, reshuffle, solve, locked, total: n, solved: locked === n, moves }
}

export function PuzzleBoard({
  picture,
  cols,
  rows,
  order,
  selected,
  onTap,
  painting = false,
  solved,
  moves,
  label,
  className,
}: {
  picture: string
  cols: number
  rows: number
  order: number[]
  selected: number | null
  onTap: (cell: number) => void
  painting?: boolean
  solved: boolean
  moves: number
  label: string
  className?: string
}) {
  const cellOf = new Map(order.map((p, c) => [p, c]))
  return (
    <div
      role="group"
      aria-label={label}
      data-painting={painting || undefined}
      className={cn("toy-board", className)}
      style={{ aspectRatio: `${cols * 3} / ${rows * 4}` }}
    >
      {order.map((_, p) => {
        const c = cellOf.get(p) ?? p
        const x = c % cols
        const y = Math.floor(c / cols)
        const locked = c === p
        return (
          <button
            key={p}
            type="button"
            className="toy-piece"
            data-locked={locked || undefined}
            data-selected={selected === c || undefined}
            aria-pressed={selected === c}
            aria-label={locked ? `Card ${p + 1}, in its place` : `Card ${p + 1}`}
            disabled={locked}
            onClick={() => onTap(c)}
            style={{ width: `${100 / cols}%`, height: `${100 / rows}%`, transform: `translate(${x * 100}%, ${y * 100}%)` }}
          >
            <span className="toy-lift">
              <span
                className="toy-img"
                style={{
                  backgroundImage: `url(${picture})`,
                  backgroundSize: `${cols * 100}% ${rows * 100}%`,
                  backgroundPosition: `${((p % cols) / (cols - 1)) * 100}% ${(Math.floor(p / cols) / (rows - 1)) * 100}%`,
                }}
              />
              <span className="toy-frame" />
            </span>
          </button>
        )
      })}
      {solved && (
        <div className="toy-done" aria-live="polite">
          <span className="flex text-[#f0a30f]">
            {[0, 1, 2].map((i) => (
              <StarIcon key={i} className="size-4 fill-current" strokeWidth={0} />
            ))}
          </span>
          Solved in {moves} {moves === 1 ? "move" : "moves"}
        </div>
      )}
    </div>
  )
}
