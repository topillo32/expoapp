"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verificarAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "admin") {
    throw new Error("No tienes permiso para hacer esto.");
  }

  return { supabase, adminId: user.id };
}

export async function alternarActivo(userId: string, activo: boolean) {
  const { supabase, adminId } = await verificarAdmin();

  if (userId === adminId && !activo) {
    throw new Error("No puedes suspender tu propia cuenta.");
  }

  const { error } = await supabase.from("perfiles").update({ activo }).eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function aprobarOrganizador(userId: string) {
  const { supabase } = await verificarAdmin();

  const { error } = await supabase
    .from("perfiles")
    .update({ aprobado: true })
    .eq("id", userId)
    .eq("rol", "organizador");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

function generarPasswordTemporal(): string {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

export async function resetearPassword(userId: string): Promise<{ password?: string; error?: string }> {
  try {
    await verificarAdmin();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No autorizado." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo crear el cliente admin." };
  }

  const nuevaPassword = generarPasswordTemporal();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: nuevaPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { password: nuevaPassword };
}
