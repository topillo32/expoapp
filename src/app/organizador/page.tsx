import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Landmark,
  LayoutGrid,
  MapPin,
  PartyPopper,
  PlusCircle,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TarjetaEstadistica } from "@/components/tarjeta-estadistica";
import { calcularResumenPorExpo, type PuestoParaIngreso } from "@/lib/contabilidad";
import { formatearPrecio, formatearRangoFechas } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

interface ExpoPropia {
  id: string;
  nombre: string;
  estado: "borrador" | "publicada" | "finalizada";
  fechaInicio: string;
  fechaFin: string;
  maxPuestos: number;
  flyerUrl: string | null;
  recinto: { nombre: string; ciudad: string } | null;
}

const etiquetaEstado: Record<ExpoPropia["estado"], string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  finalizada: "Finalizada",
};

const variantePorEstado: Record<ExpoPropia["estado"], "default" | "secondary" | "outline"> = {
  borrador: "secondary",
  publicada: "default",
  finalizada: "outline",
};

export default async function OrganizadorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expos, error } = await supabase
    .from("expos")
    .select(
      `
      id,
      nombre,
      estado,
      fechaInicio:fecha_inicio,
      fechaFin:fecha_fin,
      maxPuestos:max_puestos,
      flyerUrl:flyer_url,
      recinto:recinto_id(nombre, ciudad)
      `,
    )
    .eq("organizador_id", user!.id)
    .order("creado_en", { ascending: false })
    .returns<ExpoPropia[]>();

  if (error) {
    throw error;
  }

  const expoIds = (expos ?? []).map((e) => e.id);

  const { data: puestos, error: errorPuestos } =
    expoIds.length === 0
      ? { data: [] as (PuestoParaIngreso & { expoId: string })[], error: null }
      : await supabase
          .from("puestos")
          .select("expoId:expo_id, estado, esGratis:es_gratis, precio, tipo")
          .in("expo_id", expoIds)
          .returns<(PuestoParaIngreso & { expoId: string })[]>();

  if (errorPuestos) {
    throw errorPuestos;
  }

  const resumenPorExpo = calcularResumenPorExpo(expos ?? [], puestos ?? []);
  const resumenPorExpoId = new Map(resumenPorExpo.map((r) => [r.expoId, r.resumen]));

  const postulacionesPorExpoId = new Map<string, number>();
  for (const p of puestos ?? []) {
    postulacionesPorExpoId.set(p.expoId, (postulacionesPorExpoId.get(p.expoId) ?? 0) + 1);
  }

  const totalEventos = expos?.length ?? 0;
  const eventosActivos = (expos ?? []).filter((e) => e.estado === "publicada").length;
  const totalPostulaciones = (puestos ?? []).length;
  const puestosVendidos = (puestos ?? []).filter((p) => p.estado === "aprobado").length;
  const ingresoTotal = resumenPorExpo.reduce((acc, r) => acc + r.resumen.ingresoTotal, 0);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">Mis eventos</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Administra todas tus ferias, postulaciones, pagos y puestos.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-3 sm:gap-3">
          <div className="flex items-center gap-1 text-sm">
            <Link
              href="/organizador/contabilidad"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <Wallet className="size-4" />
              Contabilidad
            </Link>
            <Link
              href="/organizador/cuentas"
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <Landmark className="size-4" />
              Cuentas bancarias
            </Link>
          </div>
          <Link
            href="/organizador/expos/nueva"
            className={buttonVariants({
              size: "lg",
              className: "shadow-lg shadow-primary/25",
            })}
          >
            <PlusCircle className="size-4" />
            Crear evento
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <TarjetaEstadistica
          icono={<LayoutGrid className="size-4 text-primary" />}
          titulo="Eventos"
          valor={String(totalEventos)}
          detalle="creados en total"
        />
        <TarjetaEstadistica
          icono={<Sparkles className="size-4 text-primary" />}
          titulo="Eventos activos"
          valor={String(eventosActivos)}
          detalle="publicados ahora"
        />
        <TarjetaEstadistica
          icono={<ClipboardList className="size-4 text-muted-foreground" />}
          titulo="Postulaciones"
          valor={String(totalPostulaciones)}
          detalle="recibidas en total"
        />
        <TarjetaEstadistica
          icono={<Store className="size-4 text-muted-foreground" />}
          titulo="Puestos vendidos"
          valor={String(puestosVendidos)}
          detalle="puestos aprobados"
        />
        <TarjetaEstadistica
          icono={<CircleDollarSign className="size-4 text-success" />}
          titulo="Ingresos"
          valor={formatearPrecio(ingresoTotal)}
          detalle="pagos confirmados"
        />
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold tracking-tight">Tus eventos</h2>

        {!expos || expos.length === 0 ? (
          <EstadoVacio />
        ) : (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {expos.map((expo) => {
              const resumen = resumenPorExpoId.get(expo.id);
              const vendidos = (resumen?.puestosPagados ?? 0) + (resumen?.puestosGratis ?? 0);
              const postulaciones = postulacionesPorExpoId.get(expo.id) ?? 0;

              return (
                <Card key={expo.id} className="card-glow-hover flex h-full flex-col overflow-hidden pt-0">
                  <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
                    {expo.flyerUrl ? (
                      <Image
                        src={expo.flyerUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 to-transparent">
                        <Store className="size-8 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant={variantePorEstado[expo.estado]}>
                        {etiquetaEstado[expo.estado]}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pt-5">
                    <CardTitle className="text-lg">{expo.nombre}</CardTitle>
                    {expo.recinto && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {expo.recinto.nombre} · {expo.recinto.ciudad}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <CalendarDays className="size-4 text-primary" />
                      {formatearRangoFechas(expo.fechaInicio, expo.fechaFin)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Puestos</p>
                        <p className="font-medium">
                          {vendidos}/{expo.maxPuestos}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Postulaciones</p>
                        <p className="font-medium">{postulaciones}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t pt-4">
                      <Link
                        href={`/organizador/expos/${expo.id}/editar`}
                        className={buttonVariants({ size: "sm", className: "flex-1" })}
                      >
                        Administrar
                      </Link>
                      <Link
                        href={`/expos/${expo.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EstadoVacio() {
  return (
    <div className="relative mt-5 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
      <div
        className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-20"
        style={{
          maskImage: "radial-gradient(ellipse at center, black, transparent 70%)",
        }}
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PartyPopper className="size-8" />
        </div>
        <h3 className="mt-6 font-heading text-2xl font-semibold tracking-tight">
          Aún no tienes eventos
        </h3>
        <p className="mt-2 text-muted-foreground">
          Crea tu primera feria y comienza a recibir postulaciones, administrar puestos y
          controlar los pagos desde un solo lugar.
        </p>
        <Link
          href="/organizador/expos/nueva"
          className={buttonVariants({
            size: "lg",
            className: "mt-6 shadow-lg shadow-primary/25",
          })}
        >
          <PlusCircle className="size-4" />
          Crear primer evento
        </Link>
      </div>
    </div>
  );
}
