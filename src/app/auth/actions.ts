"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/types";

export interface EstadoFormAuth {
  error?: string;
}

export async function registrarse(
  _prevState: EstadoFormAuth,
  formData: FormData,
): Promise<EstadoFormAuth> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nombre = String(formData.get("nombre") ?? "");
  const rol = String(formData.get("rol") ?? "emprendedor") as RolUsuario;
  const aceptaTerminos = formData.get("aceptaTerminos") === "on";

  if (!aceptaTerminos) {
    return { error: "Debes aceptar los términos y condiciones para crear una cuenta." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, rol, aceptaTerminos: "true" } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(rol === "organizador" ? "/organizador" : "/");
}

export async function iniciarSesion(
  _prevState: EstadoFormAuth,
  formData: FormData,
): Promise<EstadoFormAuth> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
