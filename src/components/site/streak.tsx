import { useEffect, useRef } from "react"
import { CheckIcon, ChevronRightIcon, FlameIcon, LightbulbIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// The app's streak card on Home (lib/features/home), drawn in HTML so it can be played with: the week's
// seven gift days, ticked as they are claimed, and tomorrow's gift from the app's table
// (Economy.dailyRewards in lib/state/profile.dart).

const gifts = [
  { coins: 50, tickets: 0, hints: 0 },
  { coins: 75, tickets: 0, hints: 1 },
  { coins: 100, tickets: 1, hints: 0 },
  { coins: 125, tickets: 0, hints: 1 },
  { coins: 150, tickets: 1, hints: 0 },
  { coins: 200, tickets: 1, hints: 1 },
  { coins: 400, tickets: 2, hints: 2 },
]

function Coin() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#f5b524" stroke="#d99410" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="6.2" fill="#f8c540" stroke="#e0a51c" strokeWidth=".8" />
      <path d="M10 6.4l1.06 2.15 2.37.35-1.71 1.67.4 2.36L10 11.82l-2.12 1.11.4-2.36-1.71-1.67 2.37-.35z" fill="#c7810d" />
    </svg>
  )
}

function Ticket() {
  return (
    <svg viewBox="0 0 16 20" className="h-[18px] w-auto" aria-hidden>
      <path d="M2 1.5h12a1 1 0 0 1 1 1V7a2.2 2.2 0 0 0 0 4.4v6.1a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-6.1A2.2 2.2 0 0 0 1 7V2.5a1 1 0 0 1 1-1z" fill="#2fb38f" />
      <path d="M8 5.2l.8 1.62 1.79.26-1.3 1.26.31 1.78L8 9.28l-1.6.84.3-1.78-1.29-1.26 1.79-.26z" fill="#eafff8" />
      <path d="M4 14.2h8" stroke="#eafff8" strokeWidth="1.1" strokeDasharray="1.4 1.2" />
    </svg>
  )
}

/**
 * A changed streak answers quietly: a day added lifts the card, sends one band of light across it and
 * slides the new count in; a missed day dims the card for a moment. Reduced motion: no movement.
 */
function useStreakMotion(days: number) {
  const card = useRef<HTMLDivElement>(null)
  const sheen = useRef<HTMLSpanElement>(null)
  const title = useRef<HTMLSpanElement>(null)
  const last = useRef(days)
  useEffect(() => {
    const before = last.current
    last.current = days
    if (before === days || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ease = "cubic-bezier(0.3, 0.7, 0.2, 1)"
    if (days > before) {
      card.current?.animate([{ translate: "0 0" }, { translate: "0 -5px", offset: 0.35 }, { translate: "0 0" }], { duration: 520, easing: ease })
      sheen.current?.animate([{ transform: "translateX(-130%) skewX(-18deg)", opacity: 1 }, { opacity: 1, offset: 0.8 }, { transform: "translateX(360%) skewX(-18deg)", opacity: 0 }], {
        duration: 900,
        easing: ease,
      })
      title.current?.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: ease })
    } else {
      // Greyed and a touch darker, never see-through: the phone behind the card must not show.
      card.current?.animate([{ filter: "none" }, { filter: "grayscale(0.85) brightness(0.93)", offset: 0.35 }, { filter: "none" }], { duration: 700, easing: "ease-out" })
      title.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 180, easing: "ease-out", fill: "backwards" })
    }
  }, [days])
  return { card, sheen, title }
}

export function StreakCard({ days, className }: { days: number; className?: string }) {
  // Days claimed in this gift week (1 to 7); tomorrow pays the next day's gift.
  const week = days === 0 ? 0 : ((days - 1) % 7) + 1
  const next = gifts[week % 7]
  const motion = useStreakMotion(days)
  return (
    <div
      ref={motion.card}
      className={cn(
        "relative overflow-hidden rounded-[26px] bg-card p-5 text-card-foreground shadow-[0_30px_60px_-20px_rgb(20_22_50/0.45)] ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
    >
      <span ref={motion.sheen} aria-hidden className="streak-sheen" />
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand" aria-hidden>
          <FlameIcon className="size-6 fill-current" strokeWidth={1.5} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span ref={motion.title} className="text-xl leading-tight font-bold">
            {days === 0 ? "No streak yet" : `${days}-day streak`}
          </span>
          <span className="text-[15px] text-muted-foreground">{days === 0 ? "Today's picture starts a new one" : "Claimed · back tomorrow"}</span>
        </span>
        <ChevronRightIcon className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <ol className="mt-4 grid grid-cols-7 gap-1" aria-label={`${week} of 7 gift days claimed this week`}>
        {gifts.map((_, i) => {
          const claimed = i < week
          const upNext = i === week % 7 && !(week === 7)
          return (
            <li key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "streak-dot flex size-7 items-center justify-center rounded-full",
                  claimed && "bg-brand text-white dark:bg-primary",
                  upNext && "ring-2 ring-brand ring-inset",
                  !claimed && !upNext && "ring-1 ring-foreground/15 ring-inset",
                )}
                data-claimed={claimed || undefined}
              >
                {claimed && <CheckIcon className="size-4" strokeWidth={2.5} />}
              </span>
              <span className="text-xs text-muted-foreground">{i + 1}</span>
            </li>
          )
        })}
      </ol>
      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3.5 text-[15px]">
        <span className="text-muted-foreground">{days === 0 ? "Today's gift" : "Tomorrow's gift"}</span>
        <span className="flex items-center gap-1 font-semibold">
          <Coin /> {next.coins}
        </span>
        {next.tickets > 0 && (
          <span className="flex items-center gap-1 font-semibold">
            <Ticket /> {next.tickets}
          </span>
        )}
        {next.hints > 0 && (
          <span className="flex items-center gap-1 font-semibold">
            <LightbulbIcon className="size-[18px] fill-[#fde68a] text-[#d99410]" aria-hidden /> {next.hints}
          </span>
        )}
      </div>
    </div>
  )
}
