import { createFileRoute } from "@tanstack/react-router"

import { Appearance } from "@/components/site/appearance"
import { Faq, FinalCta, Footer } from "@/components/site/closing"
import { Header } from "@/components/site/header"
import { Hero } from "@/components/site/hero"
import { Lotus } from "@/components/site/lotus"
import { Calm, Daily, Giant, HowItPlays, OwnPhotos, Painting, Pictures, Together, Ways } from "@/components/site/sections"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className="page">
        <Hero />
        <HowItPlays />
        <Daily />
        <Ways />
        <Painting />
        <Giant />
        <Pictures />
        <OwnPhotos />
        <Together />
        <Lotus />
        <Calm />
        <Appearance />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
