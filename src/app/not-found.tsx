import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="max-w-2xl space-y-6 rounded-3xl border border-border/70 bg-card p-10 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Page not found</p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Oops — this page does not exist.</h1>
        <p className="text-base leading-7 text-muted-foreground">
          The page you are looking for may have been moved, renamed, or might never have existed.
          Head back to the homepage and continue browsing our menu.
        </p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  )
}
