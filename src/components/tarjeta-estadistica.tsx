import { Card, CardContent } from "@/components/ui/card";

export function TarjetaEstadistica({
  icono,
  titulo,
  valor,
  detalle,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  detalle: string;
}) {
  return (
    <Card className="card-glow-hover">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-balance">
            {valor}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          {icono}
        </div>
      </CardContent>
    </Card>
  );
}
