"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  CalendarClock,
  ImageIcon,
  Landmark,
  ListChecks,
  MapPin,
  Store,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoCiudad } from "@/components/campo-ciudad";
import { CampoComuna } from "@/components/campo-comuna";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EstadoFormExpo } from "@/lib/expo-form-types";

const estadoInicial: EstadoFormExpo = {};

interface FilaHorario {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

const TIPOS_PUESTO = [
  { valor: "emprendedor", etiqueta: "Emprendedores" },
  { valor: "comida", etiqueta: "Comida" },
  { valor: "merchandising", etiqueta: "Merchandising" },
] as const;

interface ValoresCupoTipo {
  habilitado: boolean;
  gratisTotal: boolean;
  precio?: number;
  cupoGratis?: number;
  maxCupo?: number;
}

export interface ValoresInicialesExpo {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  maxPuestos: number;
  tieneEstacionamiento: boolean;
  tieneBanos: boolean;
  banosGratis: boolean;
  tieneLuz: boolean;
  publicar: boolean;
  recintoNombre: string;
  recintoDireccion: string;
  recintoComuna: string;
  recintoCiudad: string;
  horarios: { fecha: string; horaInicio: string; horaFin: string }[];
  cuposPorTipo: Partial<
    Record<(typeof TIPOS_PUESTO)[number]["valor"], ValoresCupoTipo>
  >;
  flyerUrl?: string;
  requiereAceptacionPago: boolean;
  cuentaTransferenciaId?: string;
}

export interface CuentaDisponible {
  id: string;
  alias: string;
}

function CampoFlyer({ flyerUrlActual }: { flyerUrlActual?: string }) {
  const [preview, setPreview] = useState<string | null>(flyerUrlActual ?? null);

  function manejarCambio(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setPreview(URL.createObjectURL(archivo));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="flyer">Flyer del evento (imagen)</Label>
      <p className="text-xs text-muted-foreground">
        Se muestra en la bandeja pública de ferias y en el detalle del evento.
      </p>
      <Input
        id="flyer"
        name="flyer"
        type="file"
        accept="image/*"
        onChange={manejarCambio}
      />
      {preview ? (
        <div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
          <Image
            src={preview}
            alt="Previsualización del flyer"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="mt-2 flex aspect-video w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
          <ImageIcon className="size-4" />
          Sin flyer todavía
        </div>
      )}
    </div>
  );
}

function CampoTipoPuesto({
  valor,
  etiqueta,
  valoresIniciales,
}: {
  valor: string;
  etiqueta: string;
  valoresIniciales?: ValoresCupoTipo;
}) {
  const [habilitado, setHabilitado] = useState(
    valoresIniciales?.habilitado ?? false,
  );
  const [gratisTotal, setGratisTotal] = useState(
    valoresIniciales?.gratisTotal ?? false,
  );

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${habilitado ? "border-primary/30 bg-primary/5" : ""}`}
    >
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name={`habilitado_${valor}`}
          className="accent-primary"
          checked={habilitado}
          onChange={(e) => setHabilitado(e.target.checked)}
        />
        Ofrecer puestos de {etiqueta}
      </label>

      {habilitado && (
        <div className="mt-3 space-y-3 pl-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={`gratisTotal_${valor}`}
              className="accent-primary"
              checked={gratisTotal}
              onChange={(e) => setGratisTotal(e.target.checked)}
            />
            Todos los puestos de este tipo son gratis
          </label>

          {!gratisTotal && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Precio (CLP)</Label>
                <Input
                  name={`precio_${valor}`}
                  type="number"
                  min={0}
                  step="1"
                  required={habilitado && !gratisTotal}
                  defaultValue={valoresIniciales?.precio}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Cupos gratis dentro de este tipo (opcional)
                </Label>
                <Input
                  name={`cupoGratis_${valor}`}
                  type="number"
                  min={0}
                  defaultValue={valoresIniciales?.cupoGratis}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">
              Cupo máximo para este tipo (opcional)
            </Label>
            <Input
              name={`maxCupo_${valor}`}
              type="number"
              min={1}
              defaultValue={valoresIniciales?.maxCupo}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SeccionCard({
  icono: Icono,
  titulo,
  descripcion,
  extra,
  children,
}: {
  icono: React.ElementType;
  titulo: string;
  descripcion?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icono className="size-4 text-primary" />
            {titulo}
          </CardTitle>
          {extra}
        </div>
        {descripcion && (
          <p className="text-sm text-muted-foreground">{descripcion}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function ExpoForm({
  accion,
  valoresIniciales,
  cuentasDisponibles = [],
  textoBoton = "Crear evento",
  textoEnviando = "Creando...",
}: {
  accion: (
    prevState: EstadoFormExpo,
    formData: FormData,
  ) => Promise<EstadoFormExpo>;
  valoresIniciales?: ValoresInicialesExpo;
  cuentasDisponibles?: CuentaDisponible[];
  textoBoton?: string;
  textoEnviando?: string;
}) {
  const [estado, formAction, enviando] = useActionState(accion, estadoInicial);
  const [horarios, setHorarios] = useState<FilaHorario[]>(
    valoresIniciales && valoresIniciales.horarios.length > 0
      ? valoresIniciales.horarios.map((h, i) => ({ id: i + 1, ...h }))
      : [{ id: 1, fecha: "", horaInicio: "", horaFin: "" }],
  );
  const [tieneBanos, setTieneBanos] = useState(
    valoresIniciales?.tieneBanos ?? false,
  );
  const [requiereAceptacionPago, setRequiereAceptacionPago] = useState(
    valoresIniciales?.requiereAceptacionPago ?? false,
  );

  function agregarHorario() {
    setHorarios((prev) => [
      ...prev,
      {
        id: (prev.at(-1)?.id ?? 0) + 1,
        fecha: "",
        horaInicio: "",
        horaFin: "",
      },
    ]);
  }

  function quitarHorario(id: number) {
    setHorarios((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <form action={formAction} className="space-y-6">
      <SeccionCard icono={Store} titulo="Datos generales">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del evento</Label>
          <Input
            id="nombre"
            name="nombre"
            required
            defaultValue={valoresIniciales?.nombre}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            rows={3}
            defaultValue={valoresIniciales?.descripcion}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha de inicio</Label>
            <Input
              id="fechaInicio"
              name="fechaInicio"
              type="date"
              required
              defaultValue={valoresIniciales?.fechaInicio}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Fecha de fin</Label>
            <Input
              id="fechaFin"
              name="fechaFin"
              type="date"
              required
              defaultValue={valoresIniciales?.fechaFin}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPuestos">Máximo de puestos</Label>
          <Input
            id="maxPuestos"
            name="maxPuestos"
            type="number"
            min={1}
            required
            defaultValue={valoresIniciales?.maxPuestos}
          />
        </div>

        <CampoFlyer flyerUrlActual={valoresIniciales?.flyerUrl} />
      </SeccionCard>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SeccionCard icono={MapPin} titulo="Recinto">
          <div className="space-y-2">
            <Label htmlFor="recintoNombre">Nombre del recinto</Label>
            <Input
              id="recintoNombre"
              name="recintoNombre"
              required
              defaultValue={valoresIniciales?.recintoNombre}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recintoDireccion">Dirección</Label>
            <Input
              id="recintoDireccion"
              name="recintoDireccion"
              defaultValue={valoresIniciales?.recintoDireccion}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recintoComuna">Comuna</Label>
              <CampoComuna
                id="recintoComuna"
                name="recintoComuna"
                required
                defaultValue={valoresIniciales?.recintoComuna}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recintoCiudad">Ciudad</Label>
              <CampoCiudad
                id="recintoCiudad"
                name="recintoCiudad"
                defaultValue={valoresIniciales?.recintoCiudad}
              />
            </div>
          </div>
        </SeccionCard>

        <SeccionCard icono={ListChecks} titulo="Servicios">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="tieneEstacionamiento"
              className="accent-primary"
              defaultChecked={valoresIniciales?.tieneEstacionamiento}
            />
            Tiene estacionamiento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="tieneBanos"
              className="accent-primary"
              checked={tieneBanos}
              onChange={(e) => setTieneBanos(e.target.checked)}
            />
            Tiene baños
          </label>
          {tieneBanos && (
            <label className="ml-6 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="banosGratis"
                className="accent-primary"
                defaultChecked={valoresIniciales?.banosGratis}
              />
              Los baños son gratis
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="tieneLuz"
              className="accent-primary"
              defaultChecked={valoresIniciales?.tieneLuz}
            />
            Tiene luz eléctrica para los puestos
          </label>
        </SeccionCard>
      </div>

      <SeccionCard
        icono={CalendarClock}
        titulo="Horarios por día"
        extra={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarHorario}
          >
            Agregar día
          </Button>
        }
      >
        <div className="space-y-3">
          {horarios.map((h) => (
            <div
              key={h.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"
            >
              <div className="space-y-1">
                <Label className="text-xs">Fecha</Label>
                <Input type="date" name="horarioFecha" defaultValue={h.fecha} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hora inicio</Label>
                <Input
                  type="time"
                  name="horarioInicio"
                  defaultValue={h.horaInicio}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hora fin</Label>
                <Input type="time" name="horarioFin" defaultValue={h.horaFin} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => quitarHorario(h.id)}
                disabled={horarios.length === 1}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      </SeccionCard>

      <SeccionCard
        icono={Ticket}
        titulo="Tipos de puesto que ofrece este evento"
        descripcion="Activa los tipos que vas a permitir y define si son gratis o de pago. Los emprendedores solo van a poder postularse a los tipos que habilites acá."
      >
        <div className="space-y-3">
          {TIPOS_PUESTO.map((t) => (
            <CampoTipoPuesto
              key={t.valor}
              valor={t.valor}
              etiqueta={t.etiqueta}
              valoresIniciales={valoresIniciales?.cuposPorTipo[t.valor]}
            />
          ))}
        </div>
      </SeccionCard>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <SeccionCard
          icono={Banknote}
          titulo="Pagos"
          descripcion="Opcional: exige aceptar manualmente a cada postulante de un puesto pago antes de que vea los datos de transferencia y suba el comprobante."
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="requiereAceptacionPago"
              className="accent-primary"
              checked={requiereAceptacionPago}
              onChange={(e) => setRequiereAceptacionPago(e.target.checked)}
            />
            Requiere aceptar postulantes antes del pago
          </label>

          {requiereAceptacionPago && (
            <div className="space-y-2 pl-6">
              <Label className="text-xs">
                Cuenta de transferencia a usar en este evento
              </Label>
              {cuentasDisponibles.length === 0 ? (
                <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  Todavía no tienes cuentas registradas.{" "}
                  <Link href="/organizador/cuentas/nueva" className="underline">
                    Crea una primero
                  </Link>
                  .
                </p>
              ) : (
                <Select
                  name="cuentaTransferenciaId"
                  items={cuentasDisponibles.map((c) => ({
                    label: c.alias,
                    value: c.id,
                  }))}
                  defaultValue={valoresIniciales?.cuentaTransferenciaId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elige una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentasDisponibles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.alias}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </SeccionCard>

        <SeccionCard icono={Landmark} titulo="Publicación">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="publicar"
              className="accent-primary"
              defaultChecked={valoresIniciales?.publicar}
            />
            Publicar este evento (si no, queda como borrador)
          </label>
        </SeccionCard>
      </div>

      {estado.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={enviando}
        size="lg"
        className="shadow-lg shadow-primary/25"
      >
        {enviando ? textoEnviando : textoBoton}
      </Button>
    </form>
  );
}
