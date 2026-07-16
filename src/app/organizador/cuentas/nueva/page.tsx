import { Breadcrumbs } from "@/components/breadcrumbs";
import { CuentaForm } from "@/components/cuenta-form";
import { createClient } from "@/lib/supabase/server";
import { crearCuenta } from "../actions";

export default async function NuevaCuentaPage() {
  const supabase = await createClient();
  const { data: bancos } = await supabase
    .from("banks")
    .select("name")
    .eq("active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-xl">
      <Breadcrumbs
        items={[
          { label: "Cuentas de transferencia", href: "/organizador/cuentas" },
          { label: "Nueva cuenta" },
        ]}
      />
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Nueva cuenta</h1>
      <p className="mt-1 text-muted-foreground">
        Estos datos se muestran a los postulantes aceptados para que transfieran.
      </p>

      <div className="mt-8">
        <CuentaForm
          accion={crearCuenta}
          bancos={bancos ?? []}
          textoBoton="Crear cuenta"
          textoEnviando="Creando..."
        />
      </div>
    </div>
  );
}
