import Image from "next/image";
import Link from "next/link";
import { Bath, CalendarDays, MapPin, ParkingCircle, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatearRangoFechas } from "@/lib/format";

interface ExpoResumen {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  tieneEstacionamiento: boolean;
  tieneBanos: boolean;
  banosGratis: boolean | null;
  tieneLuz: boolean;
  flyerUrl: string | null;
  recinto: { nombre: string; ciudad: string } | null;
}

export default async function Home() {
  const supabase = await createClient();

  const { data: expos, error } = await supabase
    .from("expos")
    .select(
      `
      id,
      nombre,
      descripcion,
      fechaInicio:fecha_inicio,
      fechaFin:fecha_fin,
      tieneEstacionamiento:tiene_estacionamiento,
      tieneBanos:tiene_banos,
      banosGratis:banos_gratis,
      tieneLuz:tiene_luz,
      flyerUrl:flyer_url,
      recinto:recinto_id(nombre, ciudad)
      `,
    )
    .eq("estado", "publicada")
    .order("fecha_inicio")
    .returns<ExpoResumen[]>();

  if (error) {
    throw error;
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <section className="relative overflow-hidden border-b bg-radial-glow">
        <div
          className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-40"
          style={{ maskImage: "radial-gradient(ellipse at top left, black, transparent 65%)" }}
        />
        <div className="relative mx-auto w-full max-w-5xl px-6 py-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Encuentra tu próxima feria
          </div>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Eventos y ferias
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Descubre las próximas ferias y eventos, sus fechas y actividades. No
            necesitas iniciar sesión para ver esta información.
          </p>
          {expos.length > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="font-heading text-2xl font-semibold text-foreground">
                {expos.length}
              </span>{" "}
              {expos.length === 1 ? "evento publicado" : "eventos publicados"} ahora mismo
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {expos.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Todavía no hay eventos publicados. Vuelve a visitar esta página más
              adelante.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {expos.map((expo) => (
              <Link key={expo.id} href={`/expos/${expo.id}`} className="group block">
                <Card className="card-glow-hover h-full overflow-hidden pt-0 group-hover:-translate-y-1">
                  {expo.flyerUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={expo.flyerUrl}
                        alt={`Flyer de ${expo.nombre}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-2 bg-gradient-to-r from-primary to-primary/40" />
                  )}
                  <CardHeader className="pt-5">
                    <CardTitle>{expo.nombre}</CardTitle>
                    {expo.recinto && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {expo.recinto.nombre} · {expo.recinto.ciudad}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {expo.descripcion && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {expo.descripcion}
                      </p>
                    )}
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
                      <CalendarDays className="size-4 text-primary" />
                      {formatearRangoFechas(expo.fechaInicio, expo.fechaFin)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {expo.tieneEstacionamiento && (
                        <Badge variant="secondary">
                          <ParkingCircle className="size-3" />
                          Estacionamiento
                        </Badge>
                      )}
                      {expo.tieneBanos && (
                        <Badge variant="secondary">
                          <Bath className="size-3" />
                          Baños {expo.banosGratis ? "gratis" : "pagos"}
                        </Badge>
                      )}
                      {expo.tieneLuz && (
                        <Badge variant="secondary">
                          <Zap className="size-3" />
                          Luz eléctrica
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
