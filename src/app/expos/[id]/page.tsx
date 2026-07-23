import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  CalendarDays,
  Clock,
  MapPin,
  ParkingCircle,
  PartyPopper,
  Ticket,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatearFecha, formatearPrecio, formatearRangoFechas } from "@/lib/format";
import { FlyerLightbox } from "@/components/flyer-lightbox";

const ETIQUETA_TIPO: Record<string, string> = {
  emprendedor: "Emprendedores",
  comida: "Comida",
  merchandising: "Merchandising",
};

interface ExpoDetalle {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string;
  maxPuestos: number;
  tieneEstacionamiento: boolean;
  tieneBanos: boolean;
  banosGratis: boolean | null;
  tieneLuz: boolean;
  flyerUrl: string | null;
  organizador: { nombre: string } | null;
  recinto: { nombre: string; direccion: string; comuna: string | null; ciudad: string } | null;
  horarios: { id: string; fecha: string; horaInicio: string; horaFin: string }[];
  cuposPorTipo: {
    tipoPuesto: string;
    gratisTotal: boolean;
    cupoGratis: number;
    precio: number | null;
  }[];
  actividades: {
    id: string;
    nombre: string;
    descripcion: string | null;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    lugar: string | null;
  }[];
}

export default async function ExpoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: expo, error } = await supabase
    .from("expos")
    .select(
      `
      id,
      nombre,
      descripcion,
      fechaInicio:fecha_inicio,
      fechaFin:fecha_fin,
      maxPuestos:max_puestos,
      tieneEstacionamiento:tiene_estacionamiento,
      tieneBanos:tiene_banos,
      banosGratis:banos_gratis,
      tieneLuz:tiene_luz,
      flyerUrl:flyer_url,
      organizador:organizador_id(nombre),
      recinto:recinto_id(nombre, direccion, comuna, ciudad),
      horarios:expo_horarios(id, fecha, horaInicio:hora_inicio, horaFin:hora_fin),
      cuposPorTipo:expo_cupos_tipo(tipoPuesto:tipo_puesto, gratisTotal:gratis_total, cupoGratis:cupo_gratis, precio),
      actividades(id, nombre, descripcion, fecha, horaInicio:hora_inicio, horaFin:hora_fin, lugar)
      `,
    )
    .eq("id", id)
    .order("fecha", { referencedTable: "expo_horarios" })
    .order("fecha", { referencedTable: "actividades" })
    .maybeSingle<ExpoDetalle>();

  if (error) {
    if (error.code === "22P02") {
      notFound();
    }
    throw error;
  }

  if (!expo) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hrefPostular = user
    ? `/expos/${expo.id}/postular`
    : `/auth/login?next=/expos/${expo.id}/postular`;

  const preciosPagados = expo.cuposPorTipo
    .filter((c) => !c.gratisTotal && c.precio != null)
    .map((c) => c.precio as number);
  const precioDesde = preciosPagados.length > 0 ? Math.min(...preciosPagados) : null;
  const hayCuposGratis = expo.cuposPorTipo.some((c) => c.gratisTotal || c.cupoGratis > 0);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="relative overflow-hidden border-b bg-radial-glow">
        <div
          className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-40"
          style={{ maskImage: "radial-gradient(ellipse at top left, black, transparent 65%)" }}
        />
        <main className="relative mx-auto w-full max-w-5xl px-6 pt-10 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Volver a eventos
          </Link>

          {expo.flyerUrl && (
            <FlyerLightbox url={expo.flyerUrl} alt={`Flyer de ${expo.nombre}`} />
          )}

          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {expo.nombre}
          </h1>
          {expo.organizador && (
            <p className="mt-1 text-muted-foreground">
              Organiza: {expo.organizador.nombre}
            </p>
          )}
          {expo.descripcion && (
            <p className="mt-3 max-w-xl text-foreground">
              {expo.descripcion}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
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
                Luz eléctrica para puestos
              </Badge>
            )}
            <Badge variant="outline">
              <Ticket className="size-3" />
              Máximo {expo.maxPuestos} puestos
            </Badge>
          </div>
        </main>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            <div className="grid gap-6 sm:grid-cols-2">
              {expo.recinto && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="size-4 text-primary" />
                      Recinto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {expo.recinto.nombre}
                    </p>
                    <p>{expo.recinto.direccion}</p>
                    <p>
                      {[expo.recinto.comuna, expo.recinto.ciudad].filter(Boolean).join(", ")}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="size-4 text-primary" />
                    Fechas y horarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2 font-medium text-foreground">
                    {formatearRangoFechas(expo.fechaInicio, expo.fechaFin)}
                  </p>
                  <ul className="space-y-1">
                    {expo.horarios.map((h) => (
                      <li key={h.id} className="flex items-center gap-1.5">
                        <Clock className="size-3.5 shrink-0" />
                        {formatearFecha(h.fecha)}: {h.horaInicio} - {h.horaFin}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Puestos disponibles
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada tipo de puesto tiene su propio precio y disponibilidad.
              </p>

              {expo.cuposPorTipo.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  El organizador todavía no publicó los tipos de puesto disponibles.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {expo.cuposPorTipo.map((cupo) => (
                    <Card key={cupo.tipoPuesto} className="card-glow-hover gap-3">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {ETIQUETA_TIPO[cupo.tipoPuesto] ?? cupo.tipoPuesto}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {cupo.gratisTotal ? (
                          <Badge variant="success">Gratis</Badge>
                        ) : (
                          <>
                            <p className="text-lg font-semibold text-foreground">
                              {formatearPrecio(cupo.precio ?? 0)}
                            </p>
                            {cupo.cupoGratis > 0 && (
                              <p className="mt-1 text-xs">
                                {cupo.cupoGratis} cupos gratis disponibles
                              </p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <PartyPopper className="size-5 text-primary" />
                Calendario de actividades
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Visible para cualquier persona, sin necesidad de iniciar sesión.
              </p>

              <div className="mt-6 space-y-3">
                {expo.actividades.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay actividades cargadas para este evento.
                  </p>
                )}
                {expo.actividades.map((actividad) => (
                  <Card key={actividad.id} className="border-l-4 border-l-primary py-0">
                    <CardContent className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                      <div>
                        <p className="font-medium">{actividad.nombre}</p>
                        {actividad.descripcion && (
                          <p className="text-sm text-muted-foreground">
                            {actividad.descripcion}
                          </p>
                        )}
                        {actividad.lugar && (
                          <p className="mt-1 text-xs text-muted-foreground">{actividad.lugar}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground">
                        <Clock className="size-3.5" />
                        {formatearFecha(actividad.fecha)} · {actividad.horaInicio} -{" "}
                        {actividad.horaFin}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <Card className="border-primary/25 lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="text-lg">Postúlate a este evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Completa tus datos, elige el puesto que te acomode y sube tu
                  comprobante si corresponde. El organizador revisa cada
                  solicitud antes de confirmarla.
                </p>
                <div className="flex flex-wrap gap-2">
                  {precioDesde !== null && (
                    <Badge variant="outline">Desde {formatearPrecio(precioDesde)}</Badge>
                  )}
                  {hayCuposGratis && <Badge variant="success">Hay cupos gratis</Badge>}
                </div>
                <Link
                  href={hrefPostular}
                  className={buttonVariants({
                    size: "lg",
                    className: "w-full shadow-lg shadow-primary/25",
                  })}
                >
                  Postularme
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
