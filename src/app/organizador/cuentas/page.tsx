import Link from "next/link";
import { Landmark, PlusCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { BotonEliminarCuenta } from "./boton-eliminar-cuenta";

const ETIQUETA_TIPO_CUENTA: Record<string, string> = {
  corriente: "Cuenta corriente",
  vista: "Cuenta vista",
  ahorro: "Cuenta de ahorro",
  rut: "Cuenta RUT",
};

interface CuentaCruda {
  id: string;
  alias: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  rutTitular: string;
  nombreTitular: string;
}

export default async function CuentasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cuentas, error } = await supabase
    .from("cuentas_transferencia")
    .select(
      "id, alias, banco, tipoCuenta:tipo_cuenta, numeroCuenta:numero_cuenta, rutTitular:rut_titular, nombreTitular:nombre_titular",
    )
    .eq("organizador_id", user?.id ?? "")
    .order("creado_en", { ascending: false })
    .returns<CuentaCruda[]>();

  if (error) {
    throw error;
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Cuentas de transferencia" }]} />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Cuentas de transferencia
          </h1>
          <p className="mt-1 text-muted-foreground">
            Registra tus cuentas bancarias. Cada evento puede usar una distinta.
          </p>
        </div>
        <Link
          href="/organizador/cuentas/nueva"
          className={buttonVariants({ className: "shrink-0" })}
        >
          <PlusCircle className="size-4" />
          Nueva cuenta
        </Link>
      </div>

      {cuentas.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no registraste ninguna cuenta.{" "}
            <Link
              href="/organizador/cuentas/nueva"
              className="font-medium text-primary underline"
            >
              Crea la primera
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cuentas.map((cuenta) => (
            <Card key={cuenta.id} className="card-glow-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="size-4 text-primary" />
                  {cuenta.alias}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {cuenta.banco} · {ETIQUETA_TIPO_CUENTA[cuenta.tipoCuenta] ?? cuenta.tipoCuenta}
                </p>
                <p>N° {cuenta.numeroCuenta}</p>
                <p>
                  {cuenta.nombreTitular} · {cuenta.rutTitular}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/organizador/cuentas/${cuenta.id}/editar`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Editar
                  </Link>
                  <BotonEliminarCuenta cuentaId={cuenta.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
