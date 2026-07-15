import type { SupabaseClient } from "@supabase/supabase-js";
import { extensionSegura, validarImagen } from "@/lib/validar-archivo";

export async function subirFlyerSiCorresponde(
  supabase: SupabaseClient,
  userId: string,
  expoId: string,
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const archivo = formData.get("flyer");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return {};
  }

  const errorValidacion = await validarImagen(archivo);
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const extension = extensionSegura(archivo.name);
  const ruta = `${userId}/${expoId}/flyer.${extension}`;

  const { error: errorUpload } = await supabase.storage
    .from("flyers")
    .upload(ruta, archivo, { upsert: true });

  if (errorUpload) {
    return { error: `No se pudo subir el flyer: ${errorUpload.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("flyers").getPublicUrl(ruta);

  return { url: `${publicUrl}?v=${Date.now()}` };
}
