"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registrarse, type EstadoFormAuth } from "@/app/auth/actions";

const estadoInicial: EstadoFormAuth = {};

export default function RegistroPage() {
  const [estado, formAction, enviando] = useActionState(registrarse, estadoInicial);

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background bg-radial-glow px-6 py-12">
      <div
        className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-40"
        style={{
          maskImage: "radial-gradient(ellipse at top left, black, transparent 65%)",
        }}
      />
      <Card className="relative w-full max-w-sm shadow-xl shadow-black/20">
        <CardHeader>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Crear cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Registrate como organizador de eventos o como emprendedor.
          </p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Quiero registrarme como</Label>
              <Select
                name="rol"
                items={[
                  { label: "Emprendedor", value: "emprendedor" },
                  { label: "Organizador de eventos", value: "organizador" },
                ]}
                defaultValue="emprendedor"
              >
                <SelectTrigger id="rol" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emprendedor">Emprendedor</SelectItem>
                  <SelectItem value="organizador">Organizador de eventos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="aceptaTerminos"
                required
                className="mt-0.5 accent-primary"
              />
              <span>
                Acepto los{" "}
                <a href="/terminos" target="_blank" className="text-primary underline">
                  términos y condiciones
                </a>{" "}
                y la{" "}
                <a href="/privacidad" target="_blank" className="text-primary underline">
                  política de datos
                </a>
                .
              </span>
            </label>

            {estado.error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {estado.error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full shadow-lg shadow-primary/25"
              disabled={enviando}
            >
              {enviando ? "Creando cuenta..." : "Crear cuenta"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <a href="/auth/login" className="font-medium text-primary underline">
                Inicia sesión
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
