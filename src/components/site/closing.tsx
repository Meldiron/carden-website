import { CheckIcon } from "lucide-react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { PlayButtons } from "@/components/site/cta"
import { PictureCredits } from "@/components/site/credits"
import { Logo } from "@/components/site/header"
import { GlassPane } from "@/components/site/visuals"
import { appStoreLive, links } from "@/config"

// Short answers, one or two sentences each; a list where a sentence would turn into a wall.
const questions: { q: string; a: string; list?: string[]; note?: string }[] = [
  {
    q: "Is Carden free?",
    a: "Yes. This month's daily pictures and six starter packs are free, and you earn coins and tickets for the rest just by playing.",
  },
  {
    q: "Do I need an account?",
    a: "No, you start as a guest. Sign in with Apple or email whenever you want your progress on more devices.",
  },
  {
    q: "Where can I play?",
    a: `On iPhone, and in any browser at ${links.play.replace("https://", "")}. ${
      appStoreLive ? "The iPhone app is on the App Store." : "The iPhone app is in public beta on TestFlight for now."
    }`,
  },
  {
    q: "Can I play with friends?",
    a: "Yes. Tap Play together in a board's pause menu and share the link. Up to five people play the same picture at once, in the app or in a browser.",
  },
  {
    q: "Where do the pictures come from?",
    a: "Mostly public-domain and Creative Commons photos and paintings, each credited to its author. A few packs, marked AI, hold generated pictures.",
  },
  {
    q: "What does VIP include?",
    a: "Everything in the free game, plus:",
    list: [
      "Every pack, including past months of daily pictures",
      "One more daily and weekly quest",
      "500 bonus coins every week",
      "Unlimited photos in My Puzzles",
      "None of the game's own promotions",
    ],
    note: "Both plans start with a 7-day free trial, and you can share VIP with your family.",
  },
  {
    q: "What happens to my photos?",
    a: "They stay private to your account. If you delete your account, they go with it.",
  },
  {
    q: "How do I get help?",
    a: `Write to ${links.supportEmail}, or open Settings, then Help, in the game.`,
  },
]

export function Faq() {
  return (
    <section id="questions" className="relative scroll-mt-20 py-24">
      <GlassPane color="gold" className="top-[calc(100%-120px)] right-[calc(50%+300px)] h-[400px] w-[340px] rotate-8 hidden lg:block" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">Questions</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Anything else? Write to{" "}
            <a href={`mailto:${links.supportEmail}`} className="font-medium text-brand underline-offset-4 hover:underline">
              {links.supportEmail}
            </a>
            .
          </p>
        </div>
        <Accordion className="w-full">
          {questions.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="py-5 text-left text-lg font-semibold">{item.q}</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-3 text-base leading-relaxed text-muted-foreground">
                <p>{item.a}</p>
                {item.list && (
                  <ul className="flex flex-col gap-2">
                    {item.list.map((line) => (
                      <li key={line} className="flex items-start gap-2.5 text-foreground">
                        <CheckIcon className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
                {item.note && <p className="text-sm">{item.note}</p>}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="relative py-28">
      <GlassPane color="teal" className="top-10 left-[calc(50%+300px)] h-[380px] w-[340px] -rotate-10 hidden lg:block" />
      <GlassPane color="teal" className="top-[-40px] left-[calc(50%+60px)] h-[220px] w-[280px] rotate-12 rounded-[44px] md:hidden" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-5 text-center">
        <img src="/carden-icon.svg" alt="" width={88} height={88} className="size-22 rounded-[22.37%] shadow-lg ring-1 ring-black/5" />
        <h2 className="text-5xl leading-[1.04] font-bold tracking-tight sm:text-6xl">One last game?</h2>
        <p className="text-lg text-muted-foreground sm:text-xl">Today's picture is waiting.</p>
        <PlayButtons center className="mt-2" />
      </div>
    </section>
  )
}

export function Footer() {
  const columns = [
    {
      title: "Play",
      items: [
        { label: "Play in your browser", href: links.play },
        appStoreLive ? { label: "Carden on the App Store", href: links.appStore } : { label: "iPhone beta on TestFlight", href: links.beta },
      ],
    },
    {
      title: "Help",
      items: [
        { label: "Contact support", href: `mailto:${links.supportEmail}` },
        { label: "Privacy policy", href: links.privacy },
        { label: "Terms of use", href: links.terms },
      ],
    },
  ]
  return (
    <footer className="page-footer border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-sm text-muted-foreground">Your calm picture puzzle.</p>
          </div>
          <div className="flex gap-16">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title} className="flex flex-col gap-3">
                <h2 className="font-sans text-sm font-semibold">{col.title}</h2>
                <ul className="flex flex-col gap-2.5">
                  {col.items.map((it) => (
                    <li key={it.label}>
                      <a href={it.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {it.label}
                      </a>
                    </li>
                  ))}
                  {col.title === "Help" && (
                    <li>
                      <PictureCredits className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground" />
                    </li>
                  )}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Carden. Every picture in the game is credited to its author.</p>
          {appStoreLive && <p>Apple, the Apple logo and App Store are trademarks of Apple Inc., registered in the U.S. and other countries.</p>}
        </div>
      </div>
    </footer>
  )
}
