"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extensionSegura, validarImagen } from "@/lib/validar-archivo";

export interface EstadoSubirComprobante {
  error?: string;
  ok?: boolean;
}

export async function subirComprobantePosterior(
  puestoId: string,
  _prevState: EstadoSubirComprobante,
  formData: FormData,
): Promise<EstadoSubirComprobante> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const archivo = formData.get("comprobante");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }

  const errorValidacion = await validarImagen(archivo);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const extension = extensionSegura(archivo.name);
  const ruta = `${user.id}/${puestoId}-${Date.now()}.${extension}`;

  const { error: errorUpload } = await supabase.storage.from("comprobantes").upload(ruta, archivo);

  if (errorUpload) {
    return { error: `No se pudo subir el comprobante: ${errorUpload.message}` };
  }

  const { error: errorRpc } = await supabase.rpc("subir_comprobante_postulacion", {
    p_puesto_id: puestoId,
    p_ruta: ruta,
  });

  if (errorRpc) {
    return { error: errorRpc.message };
  }

  revalidatePath("/mis-postulaciones");
  return { ok: true };
}
