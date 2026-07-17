import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  CalendarDays,
  MapPin,
  ParkingCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiltrosEventos } from "@/components/filtros-eventos";
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
  recinto: { nombre: string; comuna: string | null; ciudad: string } | null;
}

const SELECT_EXPOS_RESUMEN = `
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
  recinto:recinto_id(nombre, comuna, ciudad)
`;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ comuna?: string; tipo?: string }>;
}) {
  const { comuna: comunaFiltro, tipo: tipoFiltro } = await searchParams;
  const supabase = await createClient();

  const { data: recintosPublicados } = await supabase
    .from("expos")
    .select("recinto:recinto_id(comuna)")
    .eq("estado", "publicada")
    .returns<{ recinto: { comuna: string | null } | null }[]>();

  const comunas = Array.from(
    new Set(
      (recintosPublicados ?? [])
        .map((e) => e.recinto?.comuna?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  let idsPorTipo: string[] | null = null;
  if (tipoFiltro) {
    const { data: cupos } = await supabase
      .from("expo_cupos_tipo")
      .select("expo_id")
      .eq("tipo_puesto", tipoFiltro);
    idsPorTipo = (cupos ?? []).map((c) => c.expo_id);
  }

  let expos: ExpoResumen[] = [];
  if (!tipoFiltro || (idsPorTipo && idsPorTipo.length > 0)) {
    let query = supabase
      .from("expos")
      .select(
        comunaFiltro
          ? SELECT_EXPOS_RESUMEN.replace("recinto_id(", "recinto_id!inner(")
          : SELECT_EXPOS_RESUMEN,
      )
      .eq("estado", "publicada")
      .order("fecha_inicio");

    if (comunaFiltro) {
      query = query.eq("recinto.comuna", comunaFiltro);
    }
    if (idsPorTipo) {
      query = query.in("id", idsPorTipo);
    }

    const { data, error } = await query.returns<ExpoResumen[]>();
    if (error) {
      throw error;
    }
    expos = data ?? [];
  }

  const hayFiltrosActivos = Boolean(comunaFiltro || tipoFiltro);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <section className="relative overflow-hidden border-b bg-radial-glow">
        <div
          className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-40"
          style={{
            maskImage:
              "radial-gradient(ellipse at top left, black, transparent 65%)",
          }}
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
          <FiltrosEventos
            comunas={comunas}
            comunaSeleccionada={comunaFiltro ?? null}
            tipoSeleccionado={tipoFiltro ?? null}
          />
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {expos.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {hayFiltrosActivos
                ? "Ningún evento publicado coincide con esos filtros."
                : "Todavía no hay eventos publicados. Vuelve a visitar esta página más adelante."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {expos.map((expo) => {
              const haFinalizado = new Date(expo.fechaFin) < new Date();
              return (
                <Link
                  key={expo.id}
                  href={`/expos/${expo.id}`}
                  className={`group block ${haFinalizado ? "opacity-70" : ""}`}
                >
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
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{expo.nombre}</CardTitle>
                        {haFinalizado && (
                          <Badge variant="outline">Evento finalizado</Badge>
                        )}
                      </div>
                      {expo.recinto && (
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          {expo.recinto.nombre} ·{" "}
                          {[expo.recinto.comuna, expo.recinto.ciudad]
                            .filter(Boolean)
                            .join(", ")}
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
