"use client";

import { useActionState } from "react";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSesion, type EstadoFormAuth } from "@/app/auth/actions";

const estadoInicial: EstadoFormAuth = {};

export default function LoginPage() {
  const [estado, formAction, enviando] = useActionState(iniciarSesion, estadoInicial);

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="size-4.5" />
          </span>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Iniciar sesión
          </h1>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>

            {estado.error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {estado.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Ingresando..." : "Ingresar"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <a href="/auth/registro" className="font-medium text-primary underline">
                Regístrate
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
