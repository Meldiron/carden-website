import { MenuIcon } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { links } from "@/config"
import { cn } from "@/lib/utils"

// `wide`: in the top bar only from 1024 px (at 768 px five links push Play now off the bar); the menu
// sheet always lists every section.
export const sections = [
  { href: "#how", label: "How it plays" },
  { href: "#together", label: "Play together", wide: true },
  { href: "#ways", label: "Ways to play" },
  { href: "#pictures", label: "Pictures" },
  { href: "#questions", label: "Questions" },
]

export function Logo({ className }: { className?: string }) {
  return (
    <a href="#top" className={cn("flex items-center gap-2.5 rounded-lg", className)} aria-label="Carden, back to the top">
      <img src="/carden-icon.svg" alt="" width={36} height={36} className="size-9 rounded-[22.37%] shadow-sm ring-1 ring-black/5" />
      <span className="font-heading text-xl font-bold tracking-tight">Carden</span>
    </a>
  )
}

export function Header() {
  return (
    <header className="frost sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Logo />
        <nav aria-label="Sections" className="ml-4 hidden items-center gap-1 md:flex">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className={cn(buttonVariants({ variant: "ghost" }), s.wide && "hidden lg:inline-flex")}>
              {s.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <a href={links.play} className={cn(buttonVariants({ size: "lg" }), "hidden rounded-full px-4 sm:inline-flex")}>
            Play now
          </a>
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open the menu" />}>
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Carden</SheetTitle>
              </SheetHeader>
              <nav aria-label="Sections" className="flex flex-col gap-1 px-4">
                {sections.map((s) => (
                  <SheetClose key={s.href} render={<a href={s.href} className={cn(buttonVariants({ variant: "ghost" }), "justify-start text-base")} />}>
                    {s.label}
                  </SheetClose>
                ))}
                <Separator className="my-3" />
                <a href={links.play} className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
                  Play in your browser
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
