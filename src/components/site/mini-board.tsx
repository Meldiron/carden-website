import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type Scene = "swap" | "join" | "lock"
export type BoardPhase = "ready" | "play" | "done" | "resetting"

const at = (cell: number) => ({ x: cell % 3, y: Math.floor(cell / 3) })

/**
 * A 3 x 3 board that plays one move per turn (styles: .mb-* in styles.css).
 *
 * `order[cell]` is the piece shown in that cell, numbered by its true place, so `order[c] === c`
 * is a locked card. The player taps `swap[0]`, then `swap[1]`, and the two cards change places; a
 * card that lands in its true place locks. Then, by scene: "join" fuses the moved card with
 * `joinLeft` (the cell to the left of `swap[1]`), "lock" shows the stars of a finished picture.
 *
 * `phase` comes from HowItPlays, which hands out the turns: "ready" shows the shuffled board, "play"
 * plays the move once, "done" keeps its result, and "resetting" fades back to the shuffled board.
 */
export function MiniBoard({
  picture,
  order,
  swap: [a, b],
  scene,
  joinLeft,
  freeze,
  phase,
  label,
  className,
}: {
  picture: string
  order: readonly number[]
  swap: readonly [number, number]
  scene: Scene
  joinLeft?: number
  /** The still frame shown with reduced motion, as a share of the run. */
  freeze: number
  phase: BoardPhase
  label: string
  className?: string
}) {
  const A = at(a)
  const B = at(b)
  const vars = (v: Record<string, string | number>) => v as React.CSSProperties
  return (
    <div
      role="img"
      aria-label={label}
      data-scene={scene}
      data-run={phase !== "ready" || undefined}
      data-fading={phase === "resetting" || undefined}
      className={cn("mb-board", className)}
      style={vars({ "--pic": `url(${picture})`, "--freeze": freeze })}
    >
      <div className="mb-stage">
        {order.map((piece, cell) => {
          const p = at(cell)
          const home = at(piece)
          const role = cell === a ? "a" : cell === b ? "b" : scene === "join" && cell === joinLeft ? "left" : undefined
          const to = cell === a ? B : cell === b ? A : p
          return (
            <div
              key={cell}
              className="mb-piece"
              data-role={role}
              data-locked={piece === cell || undefined}
              data-lands={(role === "a" || role === "b") && at(piece).x === to.x && at(piece).y === to.y ? true : undefined}
              style={vars({ "--x": p.x, "--y": p.y, "--hx": home.x, "--hy": home.y, "--dx": to.x - p.x, "--dy": to.y - p.y })}
            >
              <div className="mb-img" />
              <div className="mb-frame" />
              {role === "a" && <div className="mb-ring" />}
            </div>
          )
        })}
        {scene === "join" && joinLeft !== undefined && (
          <div className="mb-group" style={vars({ "--x": at(joinLeft).x, "--y": at(joinLeft).y })} />
        )}
        <div className="mb-tap" style={vars({ "--ax": A.x, "--ay": A.y, "--bx": B.x, "--by": B.y })} />
        {scene === "lock" && (
          <div className="mb-stars">
            {[0, 1, 2].map((i) => (
              <StarIcon key={i} className="size-4 fill-current" strokeWidth={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
