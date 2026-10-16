import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// The homepage is prerendered to static HTML at build time, so it can be served from any static host.
const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), tanstackStart({ prerender: { enabled: true, crawlLinks: true } }), viteReact()],
})

export default config
