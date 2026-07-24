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
  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (!actual) {
    return { error: "Ingresa tu contraseña actual." };
  }
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

  if (!user || !user.email) {
    return { error: "Debes iniciar sesión." };
  }

  // Re-confirma la identidad antes de cambiar la password: sin esto, una
  // sesión dejada abierta en un dispositivo compartido alcanzaba para
  // sacar al dueño real de su propia cuenta.
  const { error: errorActual } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: actual,
  });

  if (errorActual) {
    return { error: "La contraseña actual no es correcta." };
  }

  const { error } = await supabase.auth.updateUser({ password: nueva });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}
