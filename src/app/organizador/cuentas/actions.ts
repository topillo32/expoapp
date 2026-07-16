"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validarRut } from "@/lib/rut";

export interface EstadoFormCuenta {
  error?: string;
}

function parsearCampos(formData: FormData) {
  return {
    alias: String(formData.get("alias") ?? "").trim(),
    banco: String(formData.get("banco") ?? "").trim(),
    tipoCuenta: String(formData.get("tipoCuenta") ?? "").trim(),
    numeroCuenta: String(formData.get("numeroCuenta") ?? "").trim(),
    rutTitular: String(formData.get("rutTitular") ?? "").trim(),
    nombreTitular: String(formData.get("nombreTitular") ?? "").trim(),
    emailContacto: String(formData.get("emailContacto") ?? "").trim(),
  };
}

function validarCampos(campos: ReturnType<typeof parsearCampos>): string | null {
  if (
    !campos.alias ||
    !campos.banco ||
    !campos.tipoCuenta ||
    !campos.numeroCuenta ||
    !campos.rutTitular ||
    !campos.nombreTitular
  ) {
    return "Completa todos los campos obligatorios.";
  }
  if (!validarRut(campos.rutTitular)) {
    return "El RUT del titular no es válido.";
  }
  if (campos.emailContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.emailContacto)) {
    return "El email de contacto no es válido.";
  }
  return null;
}

async function bancoEsValido(
  supabase: Awaited<ReturnType<typeof createClient>>,
  banco: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("banks")
    .select("id")
    .eq("active", true)
    .eq("name", banco)
    .maybeSingle();
  return data !== null;
}

export async function crearCuenta(
  _prevState: EstadoFormCuenta,
  formData: FormData,
): Promise<EstadoFormCuenta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const campos = parsearCampos(formData);
  const errorValidacion = validarCampos(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }
  if (!(await bancoEsValido(supabase, campos.banco))) {
    return { error: "Elige un banco válido de la lista." };
  }

  const { error } = await supabase.from("cuentas_transferencia").insert({
    organizador_id: user.id,
    alias: campos.alias,
    banco: campos.banco,
    tipo_cuenta: campos.tipoCuenta,
    numero_cuenta: campos.numeroCuenta,
    rut_titular: campos.rutTitular,
    nombre_titular: campos.nombreTitular,
    email_contacto: campos.emailContacto || null,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/organizador/cuentas");
}

export async function actualizarCuenta(
  cuentaId: string,
  _prevState: EstadoFormCuenta,
  formData: FormData,
): Promise<EstadoFormCuenta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const campos = parsearCampos(formData);
  const errorValidacion = validarCampos(campos);
  if (errorValidacion) {
    return { error: errorValidacion };
  }
  if (!(await bancoEsValido(supabase, campos.banco))) {
    return { error: "Elige un banco válido de la lista." };
  }

  const { error } = await supabase
    .from("cuentas_transferencia")
    .update({
      alias: campos.alias,
      banco: campos.banco,
      tipo_cuenta: campos.tipoCuenta,
      numero_cuenta: campos.numeroCuenta,
      rut_titular: campos.rutTitular,
      nombre_titular: campos.nombreTitular,
      email_contacto: campos.emailContacto || null,
    })
    .eq("id", cuentaId)
    .eq("organizador_id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/organizador/cuentas");
}

export async function eliminarCuenta(cuentaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("cuentas_transferencia")
    .delete()
    .eq("id", cuentaId)
    .eq("organizador_id", user.id);

  if (error) {
    throw new Error(
      error.code === "23503"
        ? "No se puede borrar: hay un evento usando esta cuenta. Cambia la cuenta del evento primero."
        : error.message,
    );
  }
}
