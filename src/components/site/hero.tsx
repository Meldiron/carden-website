import { PlayButtons } from "@/components/site/cta"
import { GlassPane, Phone } from "@/components/site/visuals"

export function Hero() {
  return (
    <section id="top" className="relative">
      {/* Two large panes cross behind the phone; a third leans in from the left edge. */}
      {/* On phones the panes sit behind the screen, below the text. */}
      <GlassPane color="blue" className="top-[520px] -right-20 h-[460px] w-[340px] rotate-12 md:top-10 md:right-[4%] md:h-[620px] md:w-[520px]" />
      <GlassPane color="pink" className="top-64 right-[18%] hidden h-[520px] w-[420px] -rotate-6 md:block" />
      <GlassPane color="gold" className="-bottom-16 -left-36 h-[280px] w-[260px] rotate-[-14deg] md:-bottom-44 md:left-[calc(50%-556px-400px)] md:h-[420px] md:w-[400px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-20 md:grid-cols-[1.1fr_0.9fr] md:pt-20 md:pb-28">
        <div className="flex flex-col gap-7">
          <h1 className="text-5xl leading-[1.04] font-bold tracking-tight sm:text-6xl lg:text-7xl">Your calm picture puzzle.</h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Each photo is cut into cards and shuffled. Swap them back until the picture is whole.
          </p>
          <PlayButtons />
        </div>
        <div className="relative mx-auto w-full max-w-[340px] md:max-w-[380px]">
          <Phone name="hero" alt="A puzzle of tulip fields in Carden, about a third of its cards in place and a few groups joined" priority />
        </div>
      </div>
    </section>
  )
}
