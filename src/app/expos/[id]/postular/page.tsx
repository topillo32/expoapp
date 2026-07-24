import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PostularForm, type TipoDisponible, type UbicacionDisponible } from "./postular-form";

interface CupoTipoCrudo {
  tipoPuesto: string;
  gratisTotal: boolean;
  cupoGratis: number;
  precio: number | null;
}

interface UbicacionCruda {
  id: string;
  tipoPuesto: string;
  posX: number;
  posY: number;
  etiqueta: string | null;
  esGratis: boolean;
  precio: number | null;
}

interface ExpoParaPostular {
  id: string;
  nombre: string;
  estado: string;
  planoUrl: string | null;
  requiereAceptacionPago: boolean;
  cuposPorTipo: CupoTipoCrudo[];
  ubicaciones: UbicacionCruda[];
}

export default async function PostularPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/expos/${id}/postular`);
  }

  const { data: expo, error } = await supabase
    .from("expos")
    .select(
      `
      id,
      nombre,
      estado,
      planoUrl:plano_url,
      requiereAceptacionPago:requiere_aceptacion_pago,
      cuposPorTipo:expo_cupos_tipo(tipoPuesto:tipo_puesto, gratisTotal:gratis_total, cupoGratis:cupo_gratis, precio),
      ubicaciones:ubicaciones_puesto(id, tipoPuesto:tipo_puesto, posX:pos_x, posY:pos_y, etiqueta, esGratis:es_gratis, precio)
      `,
    )
    .eq("id", id)
    .maybeSingle<ExpoParaPostular>();

  if (error) {
    if (error.code === "22P02") {
      notFound();
    }
    throw error;
  }

  if (!expo || expo.estado !== "publicada") {
    notFound();
  }

  const { data: existentes } = await supabase
    .from("puestos")
    .select("tipo, es_gratis, ubicacion_id, estado")
    .eq("expo_id", id)
    .in("estado", ["pendiente", "aprobado"]);

  const gratisUsados = new Map<string, number>();
  const ubicacionesOcupadas = new Set<string>();
  for (const p of existentes ?? []) {
    if (p.es_gratis && p.estado === "aprobado") {
      gratisUsados.set(p.tipo, (gratisUsados.get(p.tipo) ?? 0) + 1);
    }
    if (p.ubicacion_id) {
      ubicacionesOcupadas.add(p.ubicacion_id);
    }
  }

  const tiposDisponibles: TipoDisponible[] = expo.cuposPorTipo.map((c) => ({
    ...c,
    cupoGratisDisponible: Math.max(0, c.cupoGratis - (gratisUsados.get(c.tipoPuesto) ?? 0)),
  }));

  const ubicaciones: UbicacionDisponible[] = expo.ubicaciones.map((u) => ({
    ...u,
    ocupado: ubicacionesOcupadas.has(u.id),
  }));

  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <Link
          href={`/expos/${expo.id}`}
          className="mb-4 flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a {expo.nombre}
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Postularme a {expo.nombre}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Completa tus datos para solicitar un puesto. El organizador va a
          revisar tu solicitud antes de aprobarla.
        </p>

        <div className="mt-8">
          {tiposDisponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este evento todavía no tiene tipos de puesto habilitados para
              postulación.
            </p>
          ) : (
            <PostularForm
              expoId={expo.id}
              tipos={tiposDisponibles}
              planoUrl={expo.planoUrl}
              ubicaciones={ubicaciones}
              requiereAceptacionPago={expo.requiereAceptacionPago}
            />
          )}
        </div>
      </main>
    </div>
  );
}
