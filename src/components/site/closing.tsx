import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { PlayButtons } from "@/components/site/cta"
import { Logo } from "@/components/site/header"
import { GlassPane } from "@/components/site/visuals"
import { appStoreLive, links } from "@/config"

const questions = [
  {
    q: "Is Carden free?",
    a: "Yes. You can play every day without paying. Six starter packs and this month's daily pictures are free, and other packs open with the coins and tickets you earn by playing. VIP opens every pack at once.",
  },
  {
    q: "Do I need an account?",
    a: "No. You start as a guest in one tap. Sign in with Apple or with email when you want your progress on more than one device.",
  },
  {
    q: "Where can I play?",
    a: `In any modern browser at ${links.play.replace("https://", "")}, and on iPhone. ${
      appStoreLive ? "The iPhone app is on the App Store." : "The iPhone app is in public beta on TestFlight while it gets ready for the App Store."
    }`,
  },
  {
    q: "Where do the pictures come from?",
    a: "Most are photographs and paintings from public collections such as Wikimedia Commons, under public-domain and Creative Commons licences. Every picture shows its author and licence. A few packs, marked AI, hold generated pictures.",
  },
  {
    q: "What does VIP include?",
    a: "Every pack, including past months of daily pictures, one more daily and weekly quest, 500 bonus coins every week, unlimited photos in My Puzzles, and none of the game's own promotions. Both plans start with a 7-day free trial, and VIP can be shared with your family.",
  },
  {
    q: "What happens to my photos?",
    a: "They are stored privately for your account, and only you can see them. Deleting your account deletes them too.",
  },
  {
    q: "How do I get help?",
    a: `Write to ${links.supportEmail}, or use Settings, then Help, in the game.`,
  },
]

export function Faq() {
  return (
    <section id="questions" className="relative scroll-mt-20 py-24">
      <GlassPane color="teal" className="bottom-6 -left-32 hidden h-[380px] w-[340px] rotate-6 md:block" />
      <GlassPane color="pink" className="-top-24 right-[calc(50%-556px-300px)] hidden h-[320px] w-[300px] -rotate-12 lg:block" />
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
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
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
      <GlassPane color="blue" className="top-10 -left-40 h-[300px] w-[260px] -rotate-12 sm:top-6 sm:left-[6%] sm:h-[360px] sm:w-[320px]" />
      <GlassPane color="gold" className="top-2 -right-40 h-[320px] w-[260px] rotate-12 sm:right-[6%] sm:h-[380px] sm:w-[320px]" />
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
