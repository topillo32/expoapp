"use server";

import { createClient } from "@/lib/supabase/server";

export interface EstadoCambiarPassword {
  error?: string;
  ok?: boolean;
}

export async function cambiarPassword(
  _prevState: EstadoCambiarPassword,
  formData: FormData,
): Promise<EstadoCambiarPassword> {
  const nueva = String(formData.get("nueva") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (nueva.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (nueva !== confirmar) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Debes iniciar sesión." };
  }

  const { error } = await supabase.auth.updateUser({ password: nueva });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
