import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/skeleton";

export default function CargandoContabilidadExpo() {
  return (
    <div>
      <Skeleton className="mb-6 h-5 w-48" />
      <div className="mb-8 h-10 border-b" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-4 h-40 w-full rounded-xl" />
      </section>

      <section className="mt-10">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-40 w-full rounded-xl" />
      </section>
    </div>
  );
}
