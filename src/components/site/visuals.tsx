import { cn } from "@/lib/utils"

type PaneColor = "pink" | "gold" | "blue" | "teal"

/** One pane of coloured glass behind the content (see .glass-pane in styles.css). */
export function GlassPane({ color, className, style }: { color: PaneColor; className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden data-color={color} className={cn("glass-pane", className)} style={style} />
}

/**
 * A capture in both themes: `<name>.webp` on the light site, `<name>-dark.webp` on the dark one, so
 * the app on the page always matches the page. Both are lazy and the hidden one is display:none,
 * so a visitor downloads only the theme they see.
 */
export function ThemedImage({
  name,
  alt,
  width,
  height,
  className,
  priority = false,
  ext = "webp",
}: {
  name: string
  ext?: "webp" | "svg" | "png"
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}) {
  const img = (src: string, theme: string) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={cn(className, theme)}
    />
  )
  return (
    <>
      {img(`${name}.${ext}`, "dark:hidden")}
      {img(`${name}-dark.${ext}`, "hidden dark:block")}
    </>
  )
}

/** A framed app screen (public/screens/<name>[-dark].webp, 900 x 1878, made by scripts/prepare-assets.py). */
export function Phone({ name, alt, className, priority = false }: { name: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={cn("lifted", className)}>
      <ThemedImage name={`/screens/${name}`} alt={alt} width={900} height={1878} priority={priority} className="h-auto w-full select-none" />
    </div>
  )
}

// The four ways a picture is cut, drawn as loose pieces like a board before it is solved.
const hex = (cx: number, cy: number, r: number) =>
  [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
    })
    .join(" ")

export function ShapeGlyph({ shape, className }: { shape: "cards" | "squares" | "triangles" | "hexagons"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden className={className}>
      {shape === "cards" &&
        [3, 9.5, 16].flatMap((x) => [3, 13].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width={5} height={8} rx={1.2} />))}
      {shape === "squares" &&
        [3, 9.5, 16].flatMap((x) => [3, 9.5, 16].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width={5} height={5} rx={1} />))}
      {shape === "triangles" &&
        [
          "2,11 10,11 6,3",
          "7.5,3 15.5,3 11.5,11",
          "13,11 21,11 17,3",
          "2,13 10,13 6,21",
          "7.5,21 15.5,21 11.5,13",
          "13,13 21,13 17,21",
        ].map((p) => <polygon key={p} points={p} />)}
      {shape === "hexagons" &&
        [
          [7.4, 7.6],
          [16.6, 7.6],
          [12, 15.55],
        ].map(([x, y]) => <polygon key={`${x}`} points={hex(x, y, 4.6)} />)}
    </svg>
  )
}
