"use server";

import { redirect } from "next/navigation";
import { construirCsv } from "@/lib/csv";
import { formatearFecha } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ETIQUETA_TIPO_PUESTO, type TipoPuesto } from "@/lib/types";

interface PuestoAprobadoPagado {
  tipo: TipoPuesto;
  precio: number | null;
  nombreTienda: string;
  encargadoNombre: string;
  fechaResolucion: string | null;
}

export async function exportarContabilidadExpo(expoId: string): Promise<string> {
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
    throw new Error("No tienes permiso para exportar la contabilidad de este evento.");
  }

  const { data: puestos, error } = await supabase
    .from("puestos")
    .select(
      "tipo, precio, nombreTienda:nombre_tienda, encargadoNombre:encargado_nombre, fechaResolucion:fecha_resolucion",
    )
    .eq("expo_id", expoId)
    .eq("estado", "aprobado")
    .eq("es_gratis", false)
    .order("fecha_resolucion", { ascending: false })
    .returns<PuestoAprobadoPagado[]>();

  if (error) {
    throw new Error(error.message);
  }

  return construirCsv(
    ["Fecha de pago", "Puesto", "Tipo", "Encargado", "Monto (CLP)"],
    (puestos ?? []).map((p) => [
      p.fechaResolucion ? formatearFecha(p.fechaResolucion.slice(0, 10)) : "",
      p.nombreTienda,
      ETIQUETA_TIPO_PUESTO[p.tipo] ?? p.tipo,
      p.encargadoNombre,
      p.precio ?? 0,
    ]),
  );
}
