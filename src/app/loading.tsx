import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="space-y-4">
        <Skeleton className="mx-auto h-12 w-56 rounded-full" />
        <Skeleton className="mx-auto h-5 w-64 rounded-full" />
        <Skeleton className="mx-auto h-4 w-56 rounded-full" />
      </div>

      <div className="grid w-full max-w-6xl gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="space-y-4 p-6">
            <CardTitle>
              <Skeleton className="h-6 w-3/5 rounded-full" />
            </CardTitle>
            <CardContent className="space-y-4">
              <Skeleton className="h-48 w-full rounded-[1.25rem]" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-5/6 rounded-full" />
                <Skeleton className="h-4 w-4/6 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
