import { PlayButtons } from "@/components/site/cta"
import { GlassPane, Phone } from "@/components/site/visuals"

export function Hero() {
  return (
    <section id="top" className="relative">
      {/* Glass panes, down the whole page: every seam between two sections is crossed by a large pane where both sides have room */}
      {/* (a phone, a picture or an empty corner) and, where there is room, a smaller one on the other side. Colours run pink, blue, */}
      {/* gold, teal seam by seam (the smaller pane two steps on). No pane sits behind text, buttons, the playable boards or the */}
      {/* photo picker at any width; md: values fit tablets. */}
      <GlassPane color="pink" className="-top-30 left-[calc(50%+200px)] hidden h-[660px] w-[600px] rotate-12 md:block" />
      <GlassPane color="blue" className="left-[calc(50%+70px)] hidden h-[880px] w-[680px] rotate-10 md:-bottom-15 md:block lg:-bottom-50" />
      <GlassPane color="teal" className="bottom-[-50px] left-[calc(50%-556px-240px)] hidden h-[300px] w-[500px] -rotate-10 rounded-[44px] lg:block" />
      <GlassPane color="pink" className="bottom-105 left-[calc(50%+50px)] h-[400px] w-[360px] rotate-12 md:hidden" />
      <GlassPane color="blue" className="bottom-[-54px] left-[calc(50%-200px)] h-[560px] w-[440px] -rotate-8 md:hidden" />

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
