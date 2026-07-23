"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EstadoFormCuenta } from "@/app/organizador/cuentas/actions";

const TIPOS_CUENTA = [
  { valor: "corriente", etiqueta: "Cuenta corriente" },
  { valor: "vista", etiqueta: "Cuenta vista" },
  { valor: "ahorro", etiqueta: "Cuenta de ahorro" },
  { valor: "rut", etiqueta: "Cuenta RUT" },
] as const;

const estadoInicial: EstadoFormCuenta = {};

export interface ValoresInicialesCuenta {
  alias: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  rutTitular: string;
  nombreTitular: string;
  emailContacto: string;
}

export function CuentaForm({
  accion,
  bancos,
  valoresIniciales,
  textoBoton = "Guardar cuenta",
  textoEnviando = "Guardando...",
}: {
  accion: (prevState: EstadoFormCuenta, formData: FormData) => Promise<EstadoFormCuenta>;
  bancos: { name: string }[];
  valoresIniciales?: ValoresInicialesCuenta;
  textoBoton?: string;
  textoEnviando?: string;
}) {
  const [estado, formAction, enviando] = useActionState(accion, estadoInicial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="alias">Alias (para reconocerla al elegirla en un evento)</Label>
        <Input
          id="alias"
          name="alias"
          required
          placeholder="Ej: Cuenta principal, Cuenta empresa"
          defaultValue={valoresIniciales?.alias}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banco">Banco</Label>
          <Select
            name="banco"
            items={bancos.map((b) => ({ label: b.name, value: b.name }))}
            defaultValue={valoresIniciales?.banco}
          >
            <SelectTrigger id="banco" className="w-full">
              <SelectValue placeholder="Elige un banco" />
            </SelectTrigger>
            <SelectContent>
              {bancos.map((b) => (
                <SelectItem key={b.name} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoCuenta">Tipo de cuenta</Label>
          <Select
            name="tipoCuenta"
            items={TIPOS_CUENTA.map((t) => ({ label: t.etiqueta, value: t.valor }))}
            defaultValue={valoresIniciales?.tipoCuenta || "corriente"}
          >
            <SelectTrigger id="tipoCuenta" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CUENTA.map((t) => (
                <SelectItem key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="numeroCuenta">Número de cuenta</Label>
        <Input
          id="numeroCuenta"
          name="numeroCuenta"
          required
          defaultValue={valoresIniciales?.numeroCuenta}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rutTitular">RUT del titular</Label>
          <Input
            id="rutTitular"
            name="rutTitular"
            required
            placeholder="12345678-9"
            defaultValue={valoresIniciales?.rutTitular}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombreTitular">Nombre del titular</Label>
          <Input
            id="nombreTitular"
            name="nombreTitular"
            required
            defaultValue={valoresIniciales?.nombreTitular}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailContacto">Email de contacto (opcional)</Label>
        <Input
          id="emailContacto"
          name="emailContacto"
          type="email"
          defaultValue={valoresIniciales?.emailContacto}
        />
      </div>

      {estado.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" size="lg" className="shadow-lg shadow-primary/25" disabled={enviando}>
        {enviando ? textoEnviando : textoBoton}
      </Button>
    </form>
  );
}
