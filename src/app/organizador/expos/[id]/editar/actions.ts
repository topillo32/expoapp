"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { subirFlyerSiCorresponde } from "@/lib/expo-flyer";
import type { EstadoFormExpo } from "@/lib/expo-form-types";
import {
  parsearCamposExpo,
  parsearCuposPorTipo,
  parsearHorarios,
} from "@/lib/expo-form-parsing";

export async function actualizarExpo(
  expoId: string,
  _prevState: EstadoFormExpo,
  formData: FormData,
): Promise<EstadoFormExpo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: expoActual, error: errorExpoActual } = await supabase
    .from("expos")
    .select("id, recinto_id, organizador_id")
    .eq("id", expoId)
    .maybeSingle();

  if (errorExpoActual || !expoActual || expoActual.organizador_id !== user.id) {
    return { error: "No se encontró el evento o no tienes permiso para editarlo." };
  }

  const campos = parsearCamposExpo(formData);

  if (
    !campos.nombre ||
    !campos.fechaInicio ||
    !campos.fechaFin ||
    !campos.maxPuestos ||
    !campos.recintoNombre
  ) {
    return { error: "Completa los campos obligatorios (nombre, recinto y fechas)." };
  }

  if (campos.requiereAceptacionPago && !campos.cuentaTransferenciaId) {
    return { error: "Elige qué cuenta de transferencia va a usar este evento." };
  }

  const { error: errorRecinto } = await supabase
    .from("recintos")
    .update({
      nombre: campos.recintoNombre,
      direccion: campos.recintoDireccion,
      ciudad: campos.recintoCiudad,
    })
    .eq("id", expoActual.recinto_id);

  if (errorRecinto) {
    return { error: errorRecinto.message };
  }

  const { error: errorExpo } = await supabase
    .from("expos")
    .update({
      nombre: campos.nombre,
      descripcion: campos.descripcion || null,
      fecha_inicio: campos.fechaInicio,
      fecha_fin: campos.fechaFin,
      max_puestos: campos.maxPuestos,
      tiene_estacionamiento: campos.tieneEstacionamiento,
      tiene_banos: campos.tieneBanos,
      banos_gratis: campos.tieneBanos ? campos.banosGratis : null,
      tiene_luz: campos.tieneLuz,
      estado: campos.publicarAhora ? "publicada" : "borrador",
      requiere_aceptacion_pago: campos.requiereAceptacionPago,
      cuenta_transferencia_id: campos.requiereAceptacionPago ? campos.cuentaTransferenciaId : null,
    })
    .eq("id", expoId);

  if (errorExpo) {
    return { error: errorExpo.message };
  }

  const { url: flyerUrl, error: errorFlyer } = await subirFlyerSiCorresponde(
    supabase,
    user.id,
    expoId,
    formData,
  );

  if (errorFlyer) {
    return { error: errorFlyer };
  }

  if (flyerUrl) {
    const { error: errorGuardarFlyer } = await supabase
      .from("expos")
      .update({ flyer_url: flyerUrl })
      .eq("id", expoId);

    if (errorGuardarFlyer) {
      return { error: errorGuardarFlyer.message };
    }
  }

  const { error: errorBorrarHorarios } = await supabase
    .from("expo_horarios")
    .delete()
    .eq("expo_id", expoId);

  if (errorBorrarHorarios) {
    return { error: errorBorrarHorarios.message };
  }

  const filasHorarios = parsearHorarios(formData).map((h) => ({
    ...h,
    expo_id: expoId,
  }));

  if (filasHorarios.length > 0) {
    const { error: errorHorarios } = await supabase
      .from("expo_horarios")
      .insert(filasHorarios);

    if (errorHorarios) {
      return { error: errorHorarios.message };
    }
  }

  const { error: errorBorrarCupos } = await supabase
    .from("expo_cupos_tipo")
    .delete()
    .eq("expo_id", expoId);

  if (errorBorrarCupos) {
    return { error: errorBorrarCupos.message };
  }

  const filasCupos = parsearCuposPorTipo(formData).map((c) => ({
    ...c,
    expo_id: expoId,
  }));

  if (filasCupos.length > 0) {
    const { error: errorCupos } = await supabase
      .from("expo_cupos_tipo")
      .insert(filasCupos);

    if (errorCupos) {
      return { error: errorCupos.message };
    }
  }

  redirect("/organizador");
}
