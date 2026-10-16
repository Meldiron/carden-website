/** Where the site sends people. Change these in one place. */
export const links = {
  /** The web game. */
  play: "https://play.carden.page",
  /** The public TestFlight beta, while the iPhone app is not on the App Store yet. */
  beta: "https://testflight.apple.com/join/7nPCfg6A",
  /** The App Store product page (Apple id 6821644423). Live once the app is released. */
  appStore: "https://apps.apple.com/app/id6821644423",
  privacy: "https://github.com/Meldiron/carden/blob/main/docs/privacy-policy.md",
  terms: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
  supportEmail: "support@almostapps.eu",
} as const

/**
 * Build with VITE_APP_STORE_LIVE=true once Carden is released on the App Store: the page then shows
 * Apple's "Download on the App Store" badge instead of the beta link and adds the Smart App Banner for
 * Safari on iPhone. Apple's badge must not be shown for an app that cannot be downloaded yet.
 */
export const appStoreLive = import.meta.env.VITE_APP_STORE_LIVE === "true"

export const appStoreId = "6821644423"

/**
 * The site's public address: share previews (Open Graph, X) need an absolute image address, and the page
 * names its canonical address. Production is https://www.carden.page (carden.page redirects there);
 * VITE_SITE_URL overrides it, for example for a preview host.
 */
export const siteUrl = ((import.meta.env.VITE_SITE_URL as string | undefined) || "https://www.carden.page").replace(/\/$/, "")
