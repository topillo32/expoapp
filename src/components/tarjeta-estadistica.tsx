import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
          {icono}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-semibold tracking-tight">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
