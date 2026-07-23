import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CuentaSuspendidaPage() {
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
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="size-5 text-destructive" />
            Cuenta suspendida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Tu cuenta fue suspendida por un administrador.</p>
          <p>
            Si crees que esto es un error, escribe a{" "}
            <a href="mailto:soporteferiasync@gmail.com" className="text-primary underline">
              soporteferiasync@gmail.com
            </a>
            .
          </p>
          <Link href="/" className="inline-block text-primary underline">
            Volver al inicio
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
