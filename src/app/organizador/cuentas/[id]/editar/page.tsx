import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CuentaForm, type ValoresInicialesCuenta } from "@/components/cuenta-form";
import { createClient } from "@/lib/supabase/server";
import { actualizarCuenta } from "../../actions";

interface CuentaParaEditar {
  id: string;
  alias: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  rutTitular: string;
  nombreTitular: string;
  emailContacto: string | null;
}

export default async function EditarCuentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: cuenta, error }, { data: bancos }] = await Promise.all([
    supabase
      .from("cuentas_transferencia")
      .select(
        "id, alias, banco, tipoCuenta:tipo_cuenta, numeroCuenta:numero_cuenta, rutTitular:rut_titular, nombreTitular:nombre_titular, emailContacto:email_contacto",
      )
      .eq("id", id)
      .eq("organizador_id", user?.id ?? "")
      .maybeSingle<CuentaParaEditar>(),
    supabase.from("banks").select("name").eq("active", true).order("name"),
  ]);

  if (error) {
    if (error.code === "22P02") {
      notFound();
    }
    throw error;
  }

  if (!cuenta) {
    notFound();
  }

  const valoresIniciales: ValoresInicialesCuenta = {
    alias: cuenta.alias,
    banco: cuenta.banco,
    tipoCuenta: cuenta.tipoCuenta,
    numeroCuenta: cuenta.numeroCuenta,
    rutTitular: cuenta.rutTitular,
    nombreTitular: cuenta.nombreTitular,
    emailContacto: cuenta.emailContacto ?? "",
  };

  const accion = actualizarCuenta.bind(null, cuenta.id);

  return (
    <div className="mx-auto max-w-xl">
      <Breadcrumbs
        items={[
          { label: "Cuentas de transferencia", href: "/organizador/cuentas" },
          { label: cuenta.alias },
        ]}
      />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Editar cuenta</h1>

      <div className="mt-8">
        <CuentaForm
          accion={accion}
          bancos={bancos ?? []}
          valoresIniciales={valoresIniciales}
          textoBoton="Guardar cambios"
          textoEnviando="Guardando..."
        />
      </div>
    </div>
  );
}
