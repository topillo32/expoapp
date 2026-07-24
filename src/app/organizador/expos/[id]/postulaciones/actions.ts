"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { construirCsv } from "@/lib/csv";
import { formatearFecha } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ETIQUETA_CATEGORIA, type CategoriaPuesto, type EstadoPuesto } from "@/lib/types";

const ETIQUETA_TIPO_POSTULACION: Record<string, string> = {
  emprendedor: "Emprendedor",
  comida: "Comida",
  merchandising: "Merchandising",
};

const ETIQUETA_ESTADO_POSTULACION: Record<EstadoPuesto, string> = {
  pendiente: "Pendiente",
  aceptado: "Aceptado · esperando pago",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  cancelado: "Cancelada por el postulante",
};

async function verificarPropietario(expoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: expo } = await supabase
    .from("expos")
    .select("id, organizador_id")
    .eq("id", expoId)
    .maybeSingle();

  if (!expo || expo.organizador_id !== user.id) {
    throw new Error("No tienes permiso para gestionar las postulaciones de este evento.");
  }

  return { supabase };
}

export async function aceptarPostulante(expoId: string, puestoId: string) {
  const { supabase } = await verificarPropietario(expoId);

  const { error } = await supabase
    .from("puestos")
    .update({
      estado: "aceptado",
      resultado_visto: false,
    })
    .eq("id", puestoId)
    .eq("expo_id", expoId)
    .eq("estado", "pendiente");

  const ruta = `/organizador/expos/${expoId}/postulaciones`;

  if (error) {
    redirect(`${ruta}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(ruta);
  redirect(ruta);
}

export async function aprobarPuesto(expoId: string, puestoId: string) {
  const { supabase } = await verificarPropietario(expoId);

  const { error } = await supabase
    .from("puestos")
    .update({
      estado: "aprobado",
      fecha_resolucion: new Date().toISOString(),
      resultado_visto: false,
    })
    .eq("id", puestoId)
    .eq("expo_id", expoId);

  const ruta = `/organizador/expos/${expoId}/postulaciones`;

  if (error) {
    redirect(`${ruta}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(ruta);
  redirect(ruta);
}

interface PostulacionParaExportar {
  tipo: string;
  estado: EstadoPuesto;
  esGratis: boolean;
  precio: number | null;
  rut: string;
  razonSocial: string;
  nombreTienda: string;
  categorias: CategoriaPuesto[];
  encargadoNombre: string;
  encargadoContacto: string;
  acompanantes: number;
  motivoRechazo: string | null;
  fechaSolicitud: string;
  emprendedor: { nombre: string; contacto: string | null } | null;
  ubicacion: { etiqueta: string | null } | null;
}

export async function exportarPostulacionesExpo(expoId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: expo } = await supabase
    .from("expos")
    .select("id, nombre")
    .eq("id", expoId)
    .eq("organizador_id", user.id)
    .maybeSingle();

  if (!expo) {
    throw new Error("No tienes permiso para exportar las postulaciones de este evento.");
  }

  const { data: postulaciones, error } = await supabase
    .from("puestos")
    .select(
      `
      tipo,
      estado,
      esGratis:es_gratis,
      precio,
      rut,
      razonSocial:razon_social,
      nombreTienda:nombre_tienda,
      categorias,
      encargadoNombre:encargado_nombre,
      encargadoContacto:encargado_contacto,
      acompanantes,
      motivoRechazo:motivo_rechazo,
      fechaSolicitud:fecha_solicitud,
      emprendedor:emprendedor_id(nombre, contacto),
      ubicacion:ubicacion_id(etiqueta)
      `,
    )
    .eq("expo_id", expoId)
    .order("fecha_solicitud", { ascending: false })
    .returns<PostulacionParaExportar[]>();

  if (error) {
    throw new Error(error.message);
  }

  return construirCsv(
    [
      "Fecha de solicitud",
      "Estado",
      "Puesto",
      "Tienda",
      "Tipo",
      "Categorías",
      "RUT",
      "Razón social",
      "Encargado",
      "Contacto encargado",
      "Emprendedor",
      "Contacto emprendedor",
      "Acompañantes",
      "Precio (CLP)",
      "Motivo de rechazo",
    ],
    (postulaciones ?? []).map((p) => [
      formatearFecha(p.fechaSolicitud.slice(0, 10)),
      ETIQUETA_ESTADO_POSTULACION[p.estado] ?? p.estado,
      p.ubicacion?.etiqueta ?? "",
      p.nombreTienda,
      ETIQUETA_TIPO_POSTULACION[p.tipo] ?? p.tipo,
      p.categorias.map((c) => ETIQUETA_CATEGORIA[c] ?? c).join(" / "),
      p.rut,
      p.razonSocial,
      p.encargadoNombre,
      p.encargadoContacto,
      p.emprendedor?.nombre ?? "",
      p.emprendedor?.contacto ?? "",
      p.acompanantes,
      p.esGratis ? 0 : (p.precio ?? 0),
      p.motivoRechazo ?? "",
    ]),
  );
}

export async function rechazarPuesto(expoId: string, puestoId: string, formData: FormData) {
  const { supabase } = await verificarPropietario(expoId);

  const motivo = String(formData.get("motivo") ?? "").trim();

  const { error } = await supabase
    .from("puestos")
    .update({
      estado: "rechazado",
      motivo_rechazo: motivo || null,
      fecha_resolucion: new Date().toISOString(),
      resultado_visto: false,
    })
    .eq("id", puestoId)
    .eq("expo_id", expoId);

  const ruta = `/organizador/expos/${expoId}/postulaciones`;

  if (error) {
    redirect(`${ruta}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(ruta);
  redirect(ruta);
}
