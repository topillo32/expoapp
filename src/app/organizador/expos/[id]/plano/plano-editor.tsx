"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { AlertTriangle, Eraser, MapPinPlus, Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatearPrecio } from "@/lib/format";
import type { TipoPuesto } from "@/lib/types";
import {
  editarUbicacion,
  eliminarTodasLasUbicaciones,
  eliminarUbicacion,
  guardarUbicacionesMasivo,
  subirPlano,
  type EstadoFormPlano,
} from "./actions";

export interface UbicacionEditor {
  id: string;
  tipoPuesto: TipoPuesto;
  posX: number;
  posY: number;
  etiqueta: string | null;
  esGratis: boolean;
  precio: number | null;
}

export interface TipoDisponible {
  tipoPuesto: TipoPuesto;
  gratisTotal: boolean;
  precio: number | null;
  maxCupo: number | null;
}

interface Borrador extends UbicacionEditor {
  tempId: string;
}

const ETIQUETA_TIPO: Record<string, string> = {
  emprendedor: "Emprendedor",
  comida: "Comida",
  merchandising: "Merchandising",
};

const COLOR_TIPO: Record<string, string> = {
  emprendedor: "bg-primary",
  comida: "bg-emerald-500",
  merchandising: "bg-violet-500",
};

const PREFIJO_TIPO: Record<string, string> = {
  emprendedor: "E",
  comida: "C",
  merchandising: "M",
};

const estadoInicial: EstadoFormPlano = {};

function siguienteEtiqueta(
  tipo: string,
  existentes: { tipoPuesto: string; etiqueta: string | null }[],
) {
  const prefijo = PREFIJO_TIPO[tipo] ?? "P";
  const patron = new RegExp(`^${prefijo}-(\\d+)$`);
  const maxNumero = existentes.reduce((max, u) => {
    if (u.tipoPuesto !== tipo) return max;
    const coincidencia = u.etiqueta?.match(patron);
    const numero = coincidencia ? Number(coincidencia[1]) : 0;
    return Math.max(max, numero);
  }, 0);
  return `${prefijo}-${maxNumero + 1}`;
}

export function PlanoEditor({
  expoId,
  planoUrl,
  maxPuestos,
  ubicacionesIniciales,
  tiposDisponibles,
}: {
  expoId: string;
  planoUrl: string | null;
  maxPuestos: number;
  ubicacionesIniciales: UbicacionEditor[];
  tiposDisponibles: TipoDisponible[];
}) {
  const subirPlanoConId = subirPlano.bind(null, expoId);
  const [estadoSubida, formActionSubida, subiendo] = useActionState(
    subirPlanoConId,
    estadoInicial,
  );

  const [ubicaciones, setUbicaciones] = useState(ubicacionesIniciales);
  const [borradores, setBorradores] = useState<Borrador[]>([]);
  const [editando, setEditando] = useState<UbicacionEditor | null>(null);
  const [tipoActivo, setTipoActivo] = useState<string>(
    tiposDisponibles[0]?.tipoPuesto ?? "emprendedor",
  );
  const [gratisEdit, setGratisEdit] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorLimite, setErrorLimite] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const imagenRef = useRef<HTMLDivElement>(null);

  const totalMarcados = ubicaciones.length + borradores.length;
  const totalRestante = maxPuestos - totalMarcados;

  useEffect(() => {
    if (borradores.length === 0) return;
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [borradores.length]);

  function manejarClicImagen(e: React.MouseEvent<HTMLDivElement>) {
    if (editando || tiposDisponibles.length === 0) return;
    const tipoInfo = tiposDisponibles.find((t) => t.tipoPuesto === tipoActivo);
    if (!tipoInfo) return;

    if (totalRestante <= 0) {
      setErrorLimite(
        `Ya marcaste el máximo de puestos del evento (${maxPuestos}). Sube el "Máximo de puestos" en "Editar evento" si necesitas más.`,
      );
      return;
    }

    if (tipoInfo.maxCupo != null) {
      const marcadosTipo = [...ubicaciones, ...borradores].filter(
        (u) => u.tipoPuesto === tipoActivo,
      ).length;
      if (marcadosTipo >= tipoInfo.maxCupo) {
        setErrorLimite(
          `Ya marcaste el cupo máximo para ${ETIQUETA_TIPO[tipoActivo] ?? tipoActivo} (${tipoInfo.maxCupo}).`,
        );
        return;
      }
    }

    setErrorLimite(null);

    const rect = e.currentTarget.getBoundingClientRect();
    const posX = (e.clientX - rect.left) / rect.width;
    const posY = (e.clientY - rect.top) / rect.height;
    const etiqueta = siguienteEtiqueta(tipoActivo, [...ubicaciones, ...borradores]);

    setBorradores((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tempId: crypto.randomUUID(),
        tipoPuesto: tipoActivo as TipoPuesto,
        posX,
        posY,
        etiqueta,
        esGratis: tipoInfo.gratisTotal,
        precio: tipoInfo.gratisTotal ? null : (tipoInfo.precio ?? 0),
      },
    ]);
  }

  function quitarBorrador(tempId: string) {
    setBorradores((prev) => prev.filter((b) => b.tempId !== tempId));
  }

  function limpiarBorradores() {
    if (borradores.length === 0) return;
    const confirmado = window.confirm(
      `¿Seguro que quieres borrar los ${borradores.length} puesto(s) sin guardar? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;
    setBorradores([]);
  }

  function guardarBorradores() {
    if (borradores.length === 0) return;

    setErrorGuardado(null);
    startTransition(async () => {
      try {
        const guardadas = await guardarUbicacionesMasivo(
          expoId,
          borradores.map((b) => ({
            tipoPuesto: b.tipoPuesto,
            posX: b.posX,
            posY: b.posY,
            etiqueta: b.etiqueta ?? "",
            esGratis: b.esGratis,
            precio: b.precio,
          })),
        );
        setUbicaciones((prev) => [...prev, ...(guardadas ?? [])]);
        setBorradores([]);
      } catch (err) {
        setErrorGuardado(
          err instanceof Error ? err.message : "No se pudieron guardar los cambios.",
        );
      }
    });
  }

  function abrirEdicion(u: UbicacionEditor) {
    setEditando(u);
    setGratisEdit(u.esGratis);
  }

  function guardarEdicion(formData: FormData) {
    if (!editando) return;
    const ubicacionId = editando.id;

    startTransition(async () => {
      await editarUbicacion(expoId, ubicacionId, formData);
      const etiqueta = (formData.get("etiqueta") as string) || null;
      const esGratis = formData.get("esGratis") === "on";
      const precio = esGratis ? null : Number(formData.get("precio") ?? 0);
      setUbicaciones((prev) =>
        prev.map((u) => (u.id === ubicacionId ? { ...u, etiqueta, esGratis, precio } : u)),
      );
      setEditando(null);
    });
  }

  function borrarPin(ubicacionId: string) {
    startTransition(async () => {
      await eliminarUbicacion(expoId, ubicacionId);
      setUbicaciones((prev) => prev.filter((u) => u.id !== ubicacionId));
    });
  }

  function eliminarTodo() {
    const total = ubicaciones.length + borradores.length;
    if (total === 0) return;
    const confirmado = window.confirm(
      `¿Seguro que quieres eliminar TODOS los puestos marcados en el plano (${total})? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    setBorradores([]);
    if (ubicaciones.length === 0) return;

    startTransition(async () => {
      try {
        await eliminarTodasLasUbicaciones(expoId);
        setUbicaciones([]);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "No se pudo eliminar todo.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form action={formActionSubida} className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="plano">
            {planoUrl ? "Reemplazar imagen del plano" : "Subir imagen del plano"}
          </Label>
          <Input id="plano" name="plano" type="file" accept="image/*" required />
        </div>
        <Button type="submit" disabled={subiendo}>
          <Upload className="size-4" />
          {subiendo ? "Subiendo..." : "Subir"}
        </Button>
      </form>
      {estadoSubida.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {estadoSubida.error}
        </p>
      )}

      {planoUrl && (
        <div>
          {tiposDisponibles.length === 0 ? (
            <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              Antes de marcar puestos en el plano, habilita al menos un tipo de
              puesto (con precio o gratis) en &quot;Editar evento&quot;.
            </p>
          ) : (
            <div className="glass-panel sticky top-16 z-10 mb-3 space-y-3 rounded-xl border border-white/10 bg-card/95 p-3 shadow-lg shadow-black/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPinPlus className="size-4" />
                  Elige el tipo de puesto y luego haz clic en el plano para
                  marcarlo. Quedan{" "}
                  <span className="font-medium text-foreground">
                    {Math.max(totalRestante, 0)}
                  </span>{" "}
                  de {maxPuestos} puestos disponibles.
                </p>
                {(ubicaciones.length > 0 || borradores.length > 0) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={eliminarTodo}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                    Eliminar todo
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {tiposDisponibles.map((t) => (
                  <button
                    key={t.tipoPuesto}
                    type="button"
                    onClick={() => setTipoActivo(t.tipoPuesto)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                      tipoActivo === t.tipoPuesto
                        ? `${COLOR_TIPO[t.tipoPuesto] ?? "bg-primary"} border-transparent text-white shadow-md`
                        : "border-input text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {ETIQUETA_TIPO[t.tipoPuesto] ?? t.tipoPuesto} ·{" "}
                    {t.gratisTotal ? "Gratis" : formatearPrecio(t.precio ?? 0)}
                  </button>
                ))}
              </div>

              {errorLimite && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorLimite}
                </p>
              )}

              {errorGuardado && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {errorGuardado}
                </p>
              )}

              {borradores.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
                  <div className="flex items-start gap-2 sm:items-center">
                    <Badge variant="warning" className="shrink-0 gap-1">
                      <AlertTriangle className="size-3" />
                      Modo borrador
                    </Badge>
                    <p className="text-sm text-warning">
                      {borradores.length} cambio(s) sin guardar. Guarda cada
                      cierto tiempo: si cerrás o recargás la página antes, se
                      pierden.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={limpiarBorradores}
                      disabled={isPending}
                    >
                      <Eraser className="size-4" />
                      Limpiar
                    </Button>
                    <Button type="button" size="sm" onClick={guardarBorradores} disabled={isPending}>
                      <Save className="size-4" />
                      {isPending ? "Guardando..." : `Guardar cambios (${borradores.length})`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            ref={imagenRef}
            onClick={manejarClicImagen}
            className={`relative w-full overflow-hidden rounded-lg border select-none ${tiposDisponibles.length === 0 || totalRestante <= 0 ? "cursor-not-allowed" : "cursor-crosshair"}`}
          >
            <Image
              src={planoUrl}
              alt="Plano del recinto"
              width={1200}
              height={800}
              className="w-full h-auto"
              unoptimized
            />

            {ubicaciones.map((u) => (
              <div
                key={u.id}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${u.posX * 100}%`, top: `${u.posY * 100}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`flex size-4 items-center justify-center rounded-full text-[8px] font-semibold text-white shadow ring-2 ring-white transition-transform duration-200 group-hover:scale-110 sm:size-6 sm:text-[10px] ${COLOR_TIPO[u.tipoPuesto] ?? "bg-primary"}`}
                  title={`${ETIQUETA_TIPO[u.tipoPuesto]}${u.etiqueta ? " · " + u.etiqueta : ""}${u.esGratis ? " · Gratis" : u.precio ? ` · ${formatearPrecio(u.precio)}` : ""}`}
                >
                  {u.etiqueta ? u.etiqueta.slice(0, 2) : ""}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirEdicion(u);
                  }}
                  disabled={isPending}
                  className="absolute -top-2 -left-2 hidden size-4 items-center justify-center rounded-full bg-secondary text-secondary-foreground ring-1 ring-white group-hover:flex"
                >
                  <Pencil className="size-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    borrarPin(u.id);
                  }}
                  disabled={isPending}
                  className="absolute -top-2 -right-2 hidden size-4 items-center justify-center rounded-full bg-destructive text-white group-hover:flex"
                >
                  <Trash2 className="size-2.5" />
                </button>
              </div>
            ))}

            {borradores.map((b) => (
              <div
                key={b.tempId}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${b.posX * 100}%`, top: `${b.posY * 100}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`flex size-4 items-center justify-center rounded-full text-[8px] font-semibold text-white opacity-70 shadow ring-2 ring-dashed ring-white sm:size-6 sm:text-[10px] ${COLOR_TIPO[b.tipoPuesto] ?? "bg-primary"}`}
                  title={`${ETIQUETA_TIPO[b.tipoPuesto]} · ${b.etiqueta} · ${b.esGratis ? "Gratis" : formatearPrecio(b.precio ?? 0)} · sin guardar`}
                >
                  {b.etiqueta ? b.etiqueta.slice(0, 2) : ""}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    quitarBorrador(b.tempId);
                  }}
                  className="absolute -top-2 -right-2 hidden size-4 items-center justify-center rounded-full bg-destructive text-white group-hover:flex"
                >
                  <Trash2 className="size-2.5" />
                </button>
              </div>
            ))}
          </div>

          {editando && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">
                  Editar puesto {editando.etiqueta ?? ""}
                </p>
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
              <form action={guardarEdicion} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Etiqueta</Label>
                  <Input name="etiqueta" maxLength={10} defaultValue={editando.etiqueta ?? ""} />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="esGratis"
                    className="accent-primary"
                    checked={gratisEdit}
                    onChange={(e) => setGratisEdit(e.target.checked)}
                  />
                  Este puesto es gratis
                </label>

                {!gratisEdit && (
                  <div className="space-y-1">
                    <Label className="text-xs">Precio (CLP)</Label>
                    <Input
                      name="precio"
                      type="number"
                      min={0}
                      step="1"
                      required
                      defaultValue={editando.precio ?? undefined}
                    />
                  </div>
                )}

                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </div>
          )}

          {ubicaciones.length === 0 && borradores.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Todavía no marcaste ningún puesto en el plano.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
