import { MonitorSmartphoneIcon, MoonIcon, SunIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { GlassPane } from "@/components/site/visuals"
import { useTheme, type Theme } from "@/components/theme-provider"

// Light and dark, side by side: the same Home screen in both themes, and the app's own switch
// (Settings > Appearance > Theme: Auto, Light, Dark), which here switches this page.

const options: { value: Theme; label: string; icon: typeof SunIcon }[] = [
  { value: "system", label: "Auto", icon: MonitorSmartphoneIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
]

export function Appearance() {
  const { theme, setTheme } = useTheme()
  const screen = (src: string, alt: string, className: string) => (
    <img src={src} alt={alt} width={900} height={1878} loading="lazy" decoding="async" draggable={false} className={`lifted absolute h-auto select-none ${className}`} />
  )
  return (
    <section id="appearance" className="relative scroll-mt-20 py-24">
      <GlassPane color="pink" className="top-60 right-[calc(50%+40px)] h-[300px] w-[280px] -rotate-8 md:hidden" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 md:grid-cols-2">
        <div className="relative mx-auto h-[560px] w-full max-w-[460px] sm:h-[680px]">
          {screen("/screens/home.webp", "Carden's Home screen in the light theme", "top-0 left-0 w-[56%] max-w-[260px]")}
          {screen("/screens/home-dark.webp", "Carden's Home screen in the dark theme", "right-0 bottom-0 w-[56%] max-w-[260px]")}
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">Light by day, dark by night</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Carden follows your iPhone, or the look you pick in Settings.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span id="appearance-label" className="text-sm font-medium">
              Try it on this page
            </span>
            <ToggleGroup
              aria-labelledby="appearance-label"
              value={[theme]}
              onValueChange={(v: string[]) => v[0] && setTheme(v[0] as Theme)}
              spacing={0}
              className="frost w-full max-w-sm rounded-full p-1 shadow-sm ring-1 ring-foreground/10"
            >
              {options.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  className="h-10 flex-1 gap-2 rounded-full! px-4 text-sm text-muted-foreground hover:bg-transparent aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm dark:aria-pressed:bg-white/10"
                >
                  <o.icon data-icon="inline-start" />
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </div>
    </section>
  )
}
