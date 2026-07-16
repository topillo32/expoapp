import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CuentaSuspendidaPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-sm shadow-lg">
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
            <a href="mailto:soportebeymatch@gmail.com" className="text-primary underline">
              soportebeymatch@gmail.com
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
