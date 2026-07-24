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

export async function crearExpo(
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

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, aprobado")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "organizador" || !perfil.aprobado) {
    return { error: "Tu cuenta de organizador todavía no fue aprobada por un administrador." };
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

  const { data: recinto, error: errorRecinto } = await supabase
    .from("recintos")
    .insert({
      nombre: campos.recintoNombre,
      direccion: campos.recintoDireccion,
      comuna: campos.recintoComuna,
      ciudad: campos.recintoCiudad,
      creado_por: user.id,
    })
    .select("id")
    .single();

  if (errorRecinto || !recinto) {
    return { error: errorRecinto?.message ?? "No se pudo crear el recinto." };
  }

  const { data: expo, error: errorExpo } = await supabase
    .from("expos")
    .insert({
      organizador_id: user.id,
      recinto_id: recinto.id,
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
    .select("id")
    .single();

  if (errorExpo || !expo) {
    return { error: errorExpo?.message ?? "No se pudo crear el evento." };
  }

  const { url: flyerUrl, error: errorFlyer } = await subirFlyerSiCorresponde(
    supabase,
    user.id,
    expo.id,
    formData,
  );

  if (errorFlyer) {
    return { error: errorFlyer };
  }

  if (flyerUrl) {
    const { error: errorGuardarFlyer } = await supabase
      .from("expos")
      .update({ flyer_url: flyerUrl })
      .eq("id", expo.id);

    if (errorGuardarFlyer) {
      return { error: errorGuardarFlyer.message };
    }
  }

  const filasHorarios = parsearHorarios(formData).map((h) => ({
    ...h,
    expo_id: expo.id,
  }));

  if (filasHorarios.length > 0) {
    const { error: errorHorarios } = await supabase
      .from("expo_horarios")
      .insert(filasHorarios);

    if (errorHorarios) {
      return { error: errorHorarios.message };
    }
  }

  const filasCupos = parsearCuposPorTipo(formData).map((c) => ({
    ...c,
    expo_id: expo.id,
  }));

  if (filasCupos.length > 0) {
    const { error: errorCupos } = await supabase
      .from("expo_cupos_tipo")
      .insert(filasCupos);

    if (errorCupos) {
      return { error: errorCupos.message };
    }
  }

  redirect(`/organizador/expos/${expo.id}/plano`);
}
