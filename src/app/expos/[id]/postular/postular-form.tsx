"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Building2, MapPinned, Receipt, Store, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatearPrecio } from "@/lib/format";
import { CATEGORIAS_PUESTO, ETIQUETA_CATEGORIA } from "@/lib/types";
import { crearPostulacion, type EstadoFormPostular } from "./actions";

function NumeroPaso({ numero }: { numero: number }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
      {numero}
    </span>
  );
}

const ETIQUETA_TIPO: Record<string, string> = {
  emprendedor: "Emprendedores",
  comida: "Comida",
  merchandising: "Merchandising",
};

const COLOR_TIPO: Record<string, string> = {
  emprendedor: "bg-primary",
  comida: "bg-emerald-500",
  merchandising: "bg-violet-500",
};

export interface TipoDisponible {
  tipoPuesto: string;
  gratisTotal: boolean;
  cupoGratis: number;
  cupoGratisDisponible: number;
  precio: number | null;
}

export interface UbicacionDisponible {
  id: string;
  tipoPuesto: string;
  posX: number;
  posY: number;
  etiqueta: string | null;
  esGratis: boolean;
  precio: number | null;
  ocupado: boolean;
}

const estadoInicial: EstadoFormPostular = {};

function ComprobanteDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const previewUrl = useMemo(() => (archivo ? URL.createObjectURL(archivo) : null), [archivo]);

  function manejarArchivos(files: FileList | null) {
    const file = files?.[0] ?? null;
    if (!file) return;
    setArchivo(file);
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id="comprobante"
        name="comprobante"
        type="file"
        accept="image/*"
        required
        className="sr-only"
        onChange={(e) => manejarArchivos(e.target.files)}
      />
      <label
        htmlFor="comprobante"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          manejarArchivos(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Vista previa del comprobante"
            className="max-h-40 rounded-md object-contain"
          />
        ) : (
          <>
            <Upload className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arrastra tu comprobante aquí o{" "}
              <span className="text-primary underline">elige un archivo</span>
            </p>
          </>
        )}
        {archivo && (
          <p className="text-xs text-muted-foreground">{archivo.name}</p>
        )}
      </label>
      <p className="text-xs text-muted-foreground">
        Sube una foto o captura del comprobante de tu transferencia.
      </p>
    </div>
  );
}

export function PostularForm({
  expoId,
  tipos,
  planoUrl,
  ubicaciones,
}: {
  expoId: string;
  tipos: TipoDisponible[];
  planoUrl: string | null;
  ubicaciones: UbicacionDisponible[];
}) {
  const [estado, formAction, enviando] = useActionState(crearPostulacion, estadoInicial);
  const usaPlano = Boolean(planoUrl) && ubicaciones.length > 0;

  const [ubicacionId, setUbicacionId] = useState<string | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(tipos[0]?.tipoPuesto ?? "");
  const [quiereCupoGratis, setQuiereCupoGratis] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const tiposEnPlano = useMemo(
    () => Array.from(new Set(ubicaciones.map((u) => u.tipoPuesto))),
    [ubicaciones],
  );

  const ubicacionesFiltradas = useMemo(
    () =>
      filtroTipo === "todos" ? ubicaciones : ubicaciones.filter((u) => u.tipoPuesto === filtroTipo),
    [ubicaciones, filtroTipo],
  );

  const ubicacionSeleccionada = useMemo(
    () => ubicaciones.find((u) => u.id === ubicacionId) ?? null,
    [ubicaciones, ubicacionId],
  );

  const tipo = useMemo(
    () => tipos.find((t) => t.tipoPuesto === tipoSeleccionado),
    [tipos, tipoSeleccionado],
  );

  const esGratis = usaPlano
    ? (ubicacionSeleccionada?.esGratis ?? false)
    : (tipo?.gratisTotal ?? false) || quiereCupoGratis;

  const precio = usaPlano ? ubicacionSeleccionada?.precio : tipo?.precio;
  const requiereComprobante = !esGratis && (usaPlano ? ubicacionSeleccionada !== null : true);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="expoId" value={expoId} />
      {usaPlano && ubicacionSeleccionada && (
        <>
          <input type="hidden" name="tipo" value={ubicacionSeleccionada.tipoPuesto} />
          <input type="hidden" name="ubicacionId" value={ubicacionSeleccionada.id} />
        </>
      )}

      {usaPlano ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <NumeroPaso numero={1} />
              <MapPinned className="size-4 text-primary" />
              Elige tu lugar en el plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tiposEnPlano.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFiltroTipo("todos")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtroTipo === "todos"
                      ? "border-transparent bg-foreground text-background"
                      : "border-input text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Todos
                </button>
                {tiposEnPlano.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFiltroTipo(t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      filtroTipo === t
                        ? `${COLOR_TIPO[t] ?? "bg-primary"} border-transparent text-white`
                        : "border-input text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {ETIQUETA_TIPO[t] ?? t}
                  </button>
                ))}
              </div>
            )}

            <div className="relative w-full overflow-hidden rounded-lg border select-none">
              <Image
                src={planoUrl!}
                alt="Plano del recinto"
                width={1200}
                height={800}
                className="h-auto w-full"
                unoptimized
              />
              {ubicacionesFiltradas.map((u) => {
                const estadoPin = u.ocupado
                  ? "ocupado"
                  : u.id === ubicacionId
                    ? "seleccionado"
                    : "disponible";
                const precioTexto = u.esGratis ? "Gratis" : formatearPrecio(u.precio ?? 0);
                return (
                  <button
                    type="button"
                    key={u.id}
                    disabled={u.ocupado}
                    onClick={() => setUbicacionId(u.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 not-disabled:hover:scale-110 disabled:cursor-not-allowed"
                    style={{ left: `${u.posX * 100}%`, top: `${u.posY * 100}%` }}
                    title={`${ETIQUETA_TIPO[u.tipoPuesto] ?? u.tipoPuesto}${u.etiqueta ? " · " + u.etiqueta : ""} · ${precioTexto} · ${estadoPin === "ocupado" ? "Ocupado" : estadoPin === "seleccionado" ? "Seleccionado" : "Disponible"}`}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded-full text-[8px] font-semibold text-white shadow transition-all duration-200 sm:size-7 sm:text-[10px] ${
                        estadoPin === "ocupado"
                          ? "bg-muted-foreground/40 opacity-60 ring-2 ring-white/40"
                          : estadoPin === "seleccionado"
                            ? `${COLOR_TIPO[u.tipoPuesto] ?? "bg-primary"} scale-110 ring-4 ring-primary/50`
                            : `${COLOR_TIPO[u.tipoPuesto] ?? "bg-primary"} ring-2 ring-white/70`
                      }`}
                    >
                      {u.etiqueta ? u.etiqueta.slice(0, 2) : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-primary" /> Emprendedor
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-emerald-500" /> Comida
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-violet-500" /> Merchandising
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full ring-2 ring-primary/50" /> Seleccionado
              </span>
              <span className="flex items-center gap-1">
                <span className="size-3 rounded-full bg-muted-foreground/40 opacity-60" /> Ocupado
              </span>
            </div>

            {ubicacionSeleccionada ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium">
                  Puesto {ubicacionSeleccionada.etiqueta ?? ""} ·{" "}
                  {ETIQUETA_TIPO[ubicacionSeleccionada.tipoPuesto]}
                </p>
                <p className="mt-1">
                  {ubicacionSeleccionada.esGratis ? (
                    <span className="font-medium text-success">Gratis</span>
                  ) : (
                    <span className="text-lg font-semibold">
                      {formatearPrecio(ubicacionSeleccionada.precio ?? 0)}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ningún lugar seleccionado todavía.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <NumeroPaso numero={1} />
              <Store className="size-4 text-primary" />
              Tipo de puesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              name="tipo"
              value={tipoSeleccionado}
              onValueChange={(v) => {
                if (typeof v === "string") {
                  setTipoSeleccionado(v);
                  setQuiereCupoGratis(false);
                }
              }}
            >
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.tipoPuesto} value={t.tipoPuesto}>
                    {ETIQUETA_TIPO[t.tipoPuesto] ?? t.tipoPuesto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              {tipo?.gratisTotal ? (
                <p className="font-medium text-success">
                  Este tipo de puesto es gratis.
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold">
                    {formatearPrecio(tipo?.precio ?? 0)}
                  </p>
                  {tipo && tipo.cupoGratisDisponible > 0 && (
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="modoPago"
                          className="accent-primary"
                          checked={quiereCupoGratis}
                          onChange={() => setQuiereCupoGratis(true)}
                        />
                        Quiero uno de los {tipo.cupoGratisDisponible} cupos gratis
                        disponibles (sujeto a aprobación)
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="modoPago"
                          className="accent-primary"
                          checked={!quiereCupoGratis}
                          onChange={() => setQuiereCupoGratis(false)}
                        />
                        Voy a pagar {formatearPrecio(tipo.precio ?? 0)}
                      </label>
                      <input
                        type="hidden"
                        name="quiereCupoGratis"
                        value={quiereCupoGratis ? "on" : "off"}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <NumeroPaso numero={2} />
            <Building2 className="size-4 text-primary" />
            Datos de la empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreTienda">Nombre de la tienda / marca</Label>
            <Input id="nombreTienda" name="nombreTienda" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón social</Label>
              <Input id="razonSocial" name="razonSocial" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Input id="rut" name="rut" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>¿Qué vendes?</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIAS_PUESTO.map((categoria) => (
                <label key={categoria} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="categorias"
                    value={categoria}
                    className="accent-primary"
                  />
                  {ETIQUETA_CATEGORIA[categoria]}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <NumeroPaso numero={3} />
            <UserRound className="size-4 text-primary" />
            Datos del puesto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="encargadoNombre">Nombre del encargado</Label>
              <Input id="encargadoNombre" name="encargadoNombre" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="encargadoContacto">Contacto del encargado</Label>
              <Input id="encargadoContacto" name="encargadoContacto" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acompanantes">Número de acompañantes</Label>
            <Input
              id="acompanantes"
              name="acompanantes"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="vieneEnAuto" className="accent-primary" />
            Viene en auto
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="necesitaLuz" className="accent-primary" />
            Necesita luz eléctrica
          </label>
        </CardContent>
      </Card>

      {requiereComprobante && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <NumeroPaso numero={4} />
              <Receipt className="size-4 text-primary" />
              Comprobante de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComprobanteDropzone />
          </CardContent>
        </Card>
      )}

      {estado.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <div className="glass-panel flex flex-col gap-3 rounded-xl border border-white/10 bg-card p-4 shadow-xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Precio a pagar:{" "}
          <span className="font-heading text-lg font-semibold text-foreground">
            {esGratis ? "Gratis" : precio != null ? formatearPrecio(precio) : "—"}
          </span>
        </p>
        <Button
          type="submit"
          disabled={enviando || (usaPlano && !ubicacionSeleccionada)}
          size="lg"
        >
          {enviando ? "Enviando..." : "Enviar postulación"}
        </Button>
      </div>
    </form>
  );
}
