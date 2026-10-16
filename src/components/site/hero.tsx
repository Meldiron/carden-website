import { PlayButtons } from "@/components/site/cta"
import { GlassPane, Phone } from "@/components/site/visuals"

export function Hero() {
  return (
    <section id="top" className="relative">
      {/* Glass panes, down the whole page: every seam between two sections is crossed by a large pane where both sides have room */}
      {/* (a phone, a picture or an empty corner) and, where there is room, a smaller one on the other side. Colours run pink, blue, */}
      {/* gold, teal seam by seam (the smaller pane two steps on). No pane sits behind text, buttons, the playable boards or the */}
      {/* photo picker at any width; md: values fit tablets. */}
      <GlassPane color="pink" className="top-16 left-[calc(50%+250px)] h-[440px] w-[400px] rotate-12 hidden lg:block" />
      <GlassPane color="blue" className="top-[calc(100%-200px)] left-[calc(50%+290px)] h-[400px] w-[360px] -rotate-8 hidden lg:block" />
      <GlassPane color="blue" className="bottom-[-40px] left-[calc(50%-170px)] h-[420px] w-[340px] -rotate-8 md:hidden" />

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
