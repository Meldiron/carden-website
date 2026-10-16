import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import { ThemeProvider } from "@/components/theme-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { appStoreId, appStoreLive, isPreview, siteUrl } from "@/config"
import appCss from "../styles.css?url"

const title = "Carden: Your calm picture puzzle"
const description =
  "Swap cards until the picture is whole. A calm picture puzzle with a new photo every day, thousands more in packs, on iPhone and in your browser. Free to play."
const image = `${siteUrl}/og.png`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0b0b10", media: "(prefers-color-scheme: dark)" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Carden" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Carden, your calm picture puzzle: a puzzle of tulips on an iPhone, over panes of coloured glass" },
      ...(siteUrl ? [{ property: "og:url", content: `${siteUrl}/` }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      ...(isPreview ? [{ name: "robots", content: "noindex" }] : []),
      // Safari's Smart App Banner, once the app can be downloaded.
      ...(appStoreLive ? [{ name: "apple-itunes-app", content: `app-id=${appStoreId}` }] : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // The tab icon is the flower alone, cropped close on a transparent ground (scripts/export-lotus.mjs,
      // scripts/render-favicon.sh); the SVG switches to the dark glass on a dark tab bar.
      // A preview build shows the flower in clear glass, so its tab never passes for the real site.
      { rel: "icon", href: isPreview ? "/favicon-preview.png" : "/favicon.png", type: "image/png", sizes: "64x64" },
      { rel: "icon", href: isPreview ? "/favicon-preview.svg" : "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      ...(siteUrl ? [{ rel: "canonical", href: `${siteUrl}/` }] : []),
    ],
  }),
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-4 px-5">
      <h1 className="text-4xl font-bold">This page is not here</h1>
      <p className="text-lg text-muted-foreground">The address may be old or mistyped.</p>
      <a href="/" className={cn(buttonVariants({ size: "xl" }))}>
        Go to the home page
      </a>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
