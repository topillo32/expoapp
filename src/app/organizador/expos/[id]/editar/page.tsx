import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, MapPin } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExpoForm, type ValoresInicialesExpo } from "@/components/expo-form";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { actualizarExpo } from "./actions";

interface ExpoParaEditar {
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
  estado: string;
  flyerUrl: string | null;
  requiereAceptacionPago: boolean;
  cuentaTransferenciaId: string | null;
  recinto: {
    nombre: string;
    direccion: string | null;
    comuna: string | null;
    ciudad: string | null;
  } | null;
  horarios: { fecha: string; horaInicio: string; horaFin: string }[];
  cuposPorTipo: {
    tipoPuesto: "emprendedor" | "comida" | "merchandising";
    gratisTotal: boolean;
    cupoGratis: number;
    precio: number | null;
    maxCupo: number | null;
  }[];
}

export default async function EditarExpoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      estado,
      flyerUrl:flyer_url,
      requiereAceptacionPago:requiere_aceptacion_pago,
      cuentaTransferenciaId:cuenta_transferencia_id,
      recinto:recinto_id(nombre, direccion, comuna, ciudad),
      horarios:expo_horarios(fecha, horaInicio:hora_inicio, horaFin:hora_fin),
      cuposPorTipo:expo_cupos_tipo(tipoPuesto:tipo_puesto, gratisTotal:gratis_total, cupoGratis:cupo_gratis, precio, maxCupo:max_cupo)
      `,
    )
    .eq("id", id)
    .eq("organizador_id", user?.id ?? "")
    .order("fecha", { referencedTable: "expo_horarios" })
    .maybeSingle<ExpoParaEditar>();

  if (error) {
    if (error.code === "22P02") {
      notFound();
    }
    throw error;
  }

  if (!expo) {
    notFound();
  }

  const { data: cuentasDisponibles } = await supabase
    .from("cuentas_transferencia")
    .select("id, alias")
    .eq("organizador_id", user?.id ?? "")
    .order("creado_en", { ascending: false });

  const valoresIniciales: ValoresInicialesExpo = {
    nombre: expo.nombre,
    descripcion: expo.descripcion ?? "",
    fechaInicio: expo.fechaInicio,
    fechaFin: expo.fechaFin,
    maxPuestos: expo.maxPuestos,
    tieneEstacionamiento: expo.tieneEstacionamiento,
    tieneBanos: expo.tieneBanos,
    banosGratis: expo.banosGratis ?? false,
    tieneLuz: expo.tieneLuz,
    publicar: expo.estado === "publicada",
    flyerUrl: expo.flyerUrl ?? undefined,
    requiereAceptacionPago: expo.requiereAceptacionPago,
    cuentaTransferenciaId: expo.cuentaTransferenciaId ?? undefined,
    recintoNombre: expo.recinto?.nombre ?? "",
    recintoDireccion: expo.recinto?.direccion ?? "",
    recintoComuna: expo.recinto?.comuna ?? "",
    recintoCiudad: expo.recinto?.ciudad ?? "",
    horarios: expo.horarios,
    cuposPorTipo: Object.fromEntries(
      expo.cuposPorTipo.map((c) => [
        c.tipoPuesto,
        {
          habilitado: true,
          gratisTotal: c.gratisTotal,
          precio: c.precio ?? undefined,
          cupoGratis: c.cupoGratis,
          maxCupo: c.maxCupo ?? undefined,
        },
      ]),
    ),
  };

  const accion = actualizarExpo.bind(null, expo.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: expo.nombre }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Editar evento
          </h1>
          <p className="mt-1 text-muted-foreground">
            Actualiza los datos de {expo.nombre}.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/organizador/expos/${expo.id}/postulaciones`}
            className={buttonVariants({ variant: "outline" })}
          >
            <ClipboardList className="size-4" />
            Postulaciones
          </Link>
          <Link
            href={`/organizador/expos/${expo.id}/plano`}
            className={buttonVariants({ variant: "outline" })}
          >
            <MapPin className="size-4" />
            Plano de puestos
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <ExpoForm
          accion={accion}
          valoresIniciales={valoresIniciales}
          cuentasDisponibles={cuentasDisponibles ?? []}
          textoBoton="Guardar cambios"
          textoEnviando="Guardando..."
        />
      </div>
    </div>
  );
}
