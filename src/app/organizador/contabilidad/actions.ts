"use server";

import { redirect } from "next/navigation";
import { calcularResumenPorExpo, type PuestoParaIngreso } from "@/lib/contabilidad";
import { construirCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export async function exportarContabilidadGeneral(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: expos, error: errorExpos } = await supabase
    .from("expos")
    .select("id, nombre")
    .eq("organizador_id", user.id);

  if (errorExpos) {
    throw new Error(errorExpos.message);
  }

  const expoIds = (expos ?? []).map((e) => e.id);

  const { data: puestos, error: errorPuestos } =
    expoIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("puestos")
          .select("expoId:expo_id, estado, esGratis:es_gratis, precio, tipo")
          .in("expo_id", expoIds)
          .returns<(PuestoParaIngreso & { expoId: string })[]>();

  if (errorPuestos) {
    throw new Error(errorPuestos.message);
  }

  const porExpo = calcularResumenPorExpo(expos ?? [], puestos ?? []).sort(
    (a, b) => b.resumen.ingresoTotal - a.resumen.ingresoTotal,
  );

  return construirCsv(
    [
      "Evento",
      "Ingreso total (CLP)",
      "Puestos pagados",
      "Puestos gratis",
      "Pendiente por cobrar (CLP)",
    ],
    porExpo.map((e) => [
      e.nombre,
      e.resumen.ingresoTotal,
      e.resumen.puestosPagados,
      e.resumen.puestosGratis,
      e.resumen.montoPorCobrar,
    ]),
  );
}
