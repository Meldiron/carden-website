import { useCallback, useEffect, useRef, useState } from "react"
import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// A small playable board, drawn the way the game draws its board (.toy-* in styles.css): tap a card,
// then another, and they swap; a card in its true place locks; cards that belong together but sit
// in the wrong spot join into a group with one blue edge. In Painting, every card that is not locked
// is grey and takes its colour back as it locks.

/** A seeded random source, so a designed start is the same on the prerendered page and in the browser. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The cell to the right of / below `c` when it holds the piece that belongs there next to `order[c]`. */
function joinedRight(order: number[], cols: number, c: number) {
  const p = order[c]
  return c % cols < cols - 1 && p % cols < cols - 1 && order[c + 1] === p + 1 && p !== c
}
function joinedBelow(order: number[], cols: number, c: number) {
  const p = order[c]
  return c + cols < order.length && order[c + cols] === p + cols && p !== c
}
function joinCount(order: number[], cols: number) {
  return order.reduce((n, _, c) => n + (joinedRight(order, cols, c) ? 1 : 0) + (joinedBelow(order, cols, c) ? 1 : 0), 0)
}

/** Fills the free cells so that no extra card is in place and no extra pair is joined. */
function arrange(n: number, cols: number, fixed: Record<number, number>, random: () => number) {
  const free = Array.from({ length: n }, (_, c) => c).filter((c) => !(c in fixed))
  const pieces = Array.from({ length: n }, (_, p) => p).filter((p) => !Object.values(fixed).includes(p))
  const base = Array.from({ length: n }, (_, c) => fixed[c] ?? -1)
  const lockedWanted = Object.entries(fixed).filter(([c, p]) => Number(c) === p).length
  const joinsWanted = joinCount(base.map((p) => (p < 0 ? -99 : p)), cols)
  for (;;) {
    const order = [...base]
    const bag = [...pieces]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j], bag[i]]
    }
    free.forEach((c, i) => (order[c] = bag[i]))
    const locked = order.filter((p, c) => p === c).length
    if (locked === lockedWanted && joinCount(order, cols) === joinsWanted) return order
  }
}

/**
 * Where the Painting board starts: a corner already in colour (five cards locked together), and two
 * grey groups that belong together but sit in the wrong spot (a pair side by side, a pair one above
 * the other), so all three states of the game are on the board at once.
 */
export function paintingStart() {
  return arrange(16, 4, { 0: 0, 1: 1, 2: 2, 4: 4, 5: 5, 12: 10, 13: 11, 6: 3, 10: 7 }, seeded(11))
}

/**
 * Where the giant board starts (10 x 10, the smallest giant size): a corner already in place, as in the
 * giant capture, and two groups in the wrong spot.
 */
export function giantStart() {
  const corner: Record<number, number> = {}
  for (let r = 6; r < 10; r++) for (let c = 0; c < 4; c++) corner[r * 10 + c] = r * 10 + c
  return arrange(100, 10, { ...corner, 55: 2, 56: 3, 34: 19, 44: 29 }, seeded(13))
}

export function usePuzzle(cols: number, rows: number, start: () => number[]) {
  const n = cols * rows
  const [order, setOrder] = useState(start)
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

  /** The game's shuffle: no card in its place and no two cards joined. */
  const reshuffle = useCallback(() => {
    stop()
    setSelected(null)
    setMoves(0)
    setOrder(arrange(n, cols, {}, Math.random))
  }, [n, cols])

  /**
   * Three moves, quickly one after another. The first two lock a card, always one whose place
   * touches the cards already in colour; a card in a group takes its whole group home with it. The
   * third joins two cards that belong together, in the wrong spot, into a group when it can (and
   * otherwise locks a card too).
   */
  const solve = useCallback(() => {
    stop()
    setSelected(null)
    const swap = (o: number[], a: number, b: number) => {
      const q = [...o]
      ;[q[a], q[b]] = [q[b], q[a]]
      return q
    }
    const nearLocked = (o: number[], home: number) =>
      [home - cols, home + cols, home % cols ? home - 1 : -1, home % cols < cols - 1 ? home + 1 : -1].filter((h) => h >= 0 && h < n && o[h] === h).length
    /** The cells of the group `c` belongs to (just `c` when it is not joined to anything). */
    const groupOf = (o: number[], c: number) => {
      const seen = new Set([c])
      const queue = [c]
      while (queue.length) {
        const x = queue.pop()!
        const links = [
          joinedRight(o, cols, x) && x + 1,
          x % cols > 0 && joinedRight(o, cols, x - 1) && x - 1,
          joinedBelow(o, cols, x) && x + cols,
          x >= cols && joinedBelow(o, cols, x - cols) && x - cols,
        ]
        for (const y of links) if (typeof y === "number" && !seen.has(y)) (seen.add(y), queue.push(y))
      }
      return [...seen]
    }
    /** Moves a whole group home in one move: its cards land in their places, the cards there fill the gaps. */
    const sendHome = (o: number[], cells: number[]) => {
      const q = [...o]
      const targets = cells.map((c) => o[c])
      const displaced = targets.filter((t) => !cells.includes(t)).map((t) => o[t])
      const freed = cells.filter((c) => !targets.includes(c))
      cells.forEach((c) => (q[o[c]] = o[c]))
      freed.forEach((c, i) => (q[c] = displaced[i]))
      return q
    }
    const lockOne = (o: number[]) => {
      const loose = o.map((_, c) => c).filter((c) => o[c] !== c)
      if (!loose.length) return null
      const best = Math.max(...loose.map((c) => nearLocked(o, o[c])))
      const pick = loose.filter((c) => nearLocked(o, o[c]) === best)
      const c = pick[Math.floor(Math.random() * pick.length)]
      return sendHome(o, groupOf(o, c))
    }
    const groupOne = (o: number[]) => {
      const before = joinCount(o, cols)
      const options: number[][] = []
      o.forEach((p, c) => {
        if (p === c) return
        const steps: [number, boolean][] = [
          [1, c % cols < cols - 1 && p % cols < cols - 1],
          [-1, c % cols > 0 && p % cols > 0],
          [cols, c + cols < n && p + cols < n],
          [-cols, c - cols >= 0 && p - cols >= 0],
        ]
        for (const [d, ok] of steps) {
          if (!ok) continue
          const t = c + d
          const q = p + d
          if (o[t] === t || t === q) continue
          const next = swap(o, t, o.indexOf(q))
          if (next[c] === p && joinCount(next, cols) > before && next.filter((x, i) => x === i).length === o.filter((x, i) => x === i).length) options.push(next)
        }
      })
      return options.length ? options[Math.floor(Math.random() * options.length)] : null
    }
    const plan: number[][] = []
    let o = order
    for (let k = 0; k < 3; k++) {
      const next = (k === 2 && groupOne(o)) || lockOne(o)
      if (!next) break
      plan.push(next)
      o = next
    }
    plan.forEach((next, k) =>
      timers.current.push(
        window.setTimeout(() => {
          setOrder(next)
          setMoves((m) => m + 1)
        }, k * 170),
      ),
    )
  }, [order, cols, n])

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
  dense = false,
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
  /** Many small cards: thinner gutters, frames and edges. */
  dense?: boolean
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
      data-dense={dense || undefined}
      className={cn("toy-board", className)}
      style={{ aspectRatio: `${cols * 3} / ${rows * 4}` }}
    >
      {order.map((_, p) => {
        const c = cellOf.get(p) ?? p
        const x = c % cols
        const y = Math.floor(c / cols)
        const locked = c === p
        // Sides that close against a group-mate: no gutter there, and the group's blue edge runs
        // only along the outer sides.
        const right = joinedRight(order, cols, c)
        const left = x > 0 && joinedRight(order, cols, c - 1)
        const down = joinedBelow(order, cols, c)
        const up = y > 0 && joinedBelow(order, cols, c - cols)
        const grouped = right || left || down || up
        const g = (fused: boolean) => (fused ? "0px" : "var(--g)")
        const r = (a: boolean, b: boolean) => (a || b ? "0px" : "var(--r)")
        const inset = `${g(up)} ${g(right)} ${g(down)} ${g(left)}`
        const radius = `${r(up, left)} ${r(up, right)} ${r(down, right)} ${r(down, left)}`
        return (
          <button
            key={p}
            type="button"
            className="toy-piece"
            data-locked={locked || undefined}
            data-grouped={grouped || undefined}
            data-selected={selected === c || undefined}
            aria-pressed={selected === c}
            aria-label={locked ? `Card ${p + 1}, in its place` : grouped ? `Card ${p + 1}, joined to its neighbour` : `Card ${p + 1}`}
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
                  ...(grouped && !locked ? { clipPath: `inset(${inset} round ${radius})` } : {}),
                }}
              />
              {grouped && !locked ? (
                <span
                  className="toy-edge"
                  style={{
                    top: g(up),
                    right: g(right),
                    bottom: g(down),
                    left: g(left),
                    borderRadius: radius,
                    borderWidth: ["var(--edge)", "var(--edge)", "var(--edge)", "var(--edge)"].map((w, i) => ([up, right, down, left][i] ? "0px" : w)).join(" "),
                  }}
                />
              ) : (
                <span className="toy-frame" />
              )}
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
