import { GlobeIcon, SmartphoneIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { appStoreLive, links } from "@/config"
import { cn } from "@/lib/utils"

/**
 * The two ways in: the browser game (live today) and the iPhone app. While the app is not on the
 * App Store, the second link is the public TestFlight beta; once `appStoreLive` is on, it becomes
 * Apple's official badge (unaltered artwork, as Apple's guidelines require).
 */
export function PlayButtons({ className, center = false }: { className?: string; center?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", center && "items-center", className)}>
      <div className={cn("flex flex-wrap items-center gap-3", center && "justify-center")}>
        <a href={links.play} className={cn(buttonVariants({ size: "xl" }))}>
          <GlobeIcon data-icon="inline-start" />
          Play in your browser
        </a>
        {appStoreLive ? (
          <a href={links.appStore} aria-label="Download Carden on the App Store">
            <img src="/app-store-badge.svg" alt="Download on the App Store" width={120} height={40} className="h-12 w-auto" />
          </a>
        ) : (
          <a href={links.beta} className={cn(buttonVariants({ variant: "secondary", size: "xl" }))}>
            <SmartphoneIcon data-icon="inline-start" />
            Join the iPhone beta
          </a>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Free to play. No account needed to start.</p>
    </div>
  )
}
