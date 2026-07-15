"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extensionSegura, validarImagen } from "@/lib/validar-archivo";

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
    throw new Error("No tienes permiso para editar el plano de este evento.");
  }

  return { supabase, expoId, userId: user.id };
}

export interface EstadoFormPlano {
  error?: string;
}

export async function subirPlano(
  expoId: string,
  _prevState: EstadoFormPlano,
  formData: FormData,
): Promise<EstadoFormPlano> {
  const { supabase, userId } = await verificarPropietario(expoId);

  const archivo = formData.get("plano");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona una imagen del plano." };
  }

  const errorValidacion = await validarImagen(archivo);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const extension = extensionSegura(archivo.name);
  const ruta = `${userId}/${expoId}/plano.${extension}`;

  const {
    data: { user: usuarioAlMomentoDeSubir },
  } = await supabase.auth.getUser();

  console.log("[subirPlano] debug", {
    userIdDeVerificarPropietario: userId,
    userIdJustoAntesDeSubir: usuarioAlMomentoDeSubir?.id,
    ruta,
    nombreArchivoOriginal: archivo.name,
  });

  const { error: errorUpload } = await supabase.storage
    .from("planos")
    .upload(ruta, archivo, { upsert: true });

  if (errorUpload) {
    console.error("[subirPlano] error completo de Supabase Storage:", JSON.stringify(errorUpload, null, 2));
    return { error: `No se pudo subir el plano: ${errorUpload.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("planos").getPublicUrl(ruta);

  const { error: errorUpdate } = await supabase
    .from("expos")
    .update({ plano_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", expoId);

  if (errorUpdate) {
    return { error: errorUpdate.message };
  }

  revalidatePath(`/organizador/expos/${expoId}/plano`);
  return {};
}

export interface NuevaUbicacionInput {
  tipoPuesto: string;
  posX: number;
  posY: number;
  etiqueta: string;
  esGratis: boolean;
  precio: number | null;
}

export async function guardarUbicacionesMasivo(
  expoId: string,
  ubicaciones: NuevaUbicacionInput[],
) {
  const { supabase } = await verificarPropietario(expoId);

  if (ubicaciones.length === 0) {
    return [];
  }

  const filas = ubicaciones.map((u) => ({
    expo_id: expoId,
    tipo_puesto: u.tipoPuesto,
    pos_x: u.posX,
    pos_y: u.posY,
    etiqueta: u.etiqueta,
    es_gratis: u.esGratis,
    precio: u.esGratis ? null : u.precio,
  }));

  const { data, error } = await supabase
    .from("ubicaciones_puesto")
    .insert(filas)
    .select("id, tipoPuesto:tipo_puesto, posX:pos_x, posY:pos_y, etiqueta, esGratis:es_gratis, precio");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/organizador/expos/${expoId}/plano`);
  return data;
}

export async function editarUbicacion(
  expoId: string,
  ubicacionId: string,
  formData: FormData,
) {
  const { supabase } = await verificarPropietario(expoId);

  const etiqueta = String(formData.get("etiqueta") ?? "").trim();
  const esGratis = formData.get("esGratis") === "on";
  const precioCrudo = formData.get("precio");

  const { error } = await supabase
    .from("ubicaciones_puesto")
    .update({
      etiqueta: etiqueta || null,
      es_gratis: esGratis,
      precio: esGratis ? null : Number(precioCrudo ?? 0),
    })
    .eq("id", ubicacionId)
    .eq("expo_id", expoId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/organizador/expos/${expoId}/plano`);
}

export async function eliminarUbicacion(expoId: string, ubicacionId: string) {
  const { supabase } = await verificarPropietario(expoId);

  const { error } = await supabase
    .from("ubicaciones_puesto")
    .delete()
    .eq("id", ubicacionId);

  if (error) {
    throw new Error(
      error.code === "23503"
        ? "No se puede borrar: ya hay una postulación asociada a este lugar."
        : error.message,
    );
  }

  revalidatePath(`/organizador/expos/${expoId}/plano`);
}

export async function eliminarTodasLasUbicaciones(expoId: string) {
  const { supabase } = await verificarPropietario(expoId);

  const { error } = await supabase
    .from("ubicaciones_puesto")
    .delete()
    .eq("expo_id", expoId);

  if (error) {
    throw new Error(
      error.code === "23503"
        ? "No se puede borrar todo: algunos puestos ya tienen postulaciones asociadas. Bórralos manualmente primero si quieres eliminarlos."
        : error.message,
    );
  }

  revalidatePath(`/organizador/expos/${expoId}/plano`);
}
