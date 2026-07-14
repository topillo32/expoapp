"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    throw new Error("No tienes permiso para gestionar las postulaciones de esta expo.");
  }

  return { supabase };
}

export async function aprobarPuesto(expoId: string, puestoId: string) {
  const { supabase } = await verificarPropietario(expoId);

  const { error } = await supabase
    .from("puestos")
    .update({ estado: "aprobado", fecha_resolucion: new Date().toISOString() })
    .eq("id", puestoId)
    .eq("expo_id", expoId);

  const ruta = `/organizador/expos/${expoId}/postulaciones`;

  if (error) {
    redirect(`${ruta}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(ruta);
  redirect(ruta);
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
