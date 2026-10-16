import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import credits from "@/components/site/picture-credits.json"

// Every catalogue picture this page shows, with its author and licence, as Creative Commons asks.
// picture-credits.json is written by scripts/prepare-assets.py from Carden's catalogue.

type Credit = { title: string; author: string; licence: string; licenceUrl: string | null; where: string; url: string }

export function PictureCredits({ className }: { className?: string }) {
  return (
    <Sheet>
      <SheetTrigger className={className}>Picture credits</SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Picture credits</SheetTitle>
          <SheetDescription>The pictures on this page, with thanks to the people who made them. Each is shown under its own licence.</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col divide-y divide-border px-4 pb-8">
          {(credits as Credit[]).map((c) => (
            <li key={c.title + c.url} className="flex flex-col gap-0.5 py-3 text-sm">
              <span className="font-medium">{c.title}</span>
              <span className="text-muted-foreground">
                {c.author === "Unknown author" ? "Author unknown" : `By ${c.author}`},{" "}
                {c.licenceUrl ? (
                  <a href={c.licenceUrl} className="underline-offset-4 hover:underline" rel="license noopener" target="_blank">
                    {c.licence}
                  </a>
                ) : (
                  c.licence
                )}
                {", "}
                <a href={c.url} className="underline-offset-4 hover:underline" rel="noopener" target="_blank">
                  {c.where}
                </a>
              </span>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
