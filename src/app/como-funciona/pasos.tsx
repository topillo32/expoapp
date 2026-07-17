"use client";

import { useState } from "react";
import {
  Banknote,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  Search,
  Store,
  Upload,
} from "lucide-react";

const PASOS_ORGANIZADOR = [
  {
    icono: Store,
    titulo: "Crea tu cuenta como organizador",
    texto: "Al registrarte, elige \"Organizador de eventos\". Esto habilita tu panel.",
  },
  {
    icono: CalendarPlus,
    titulo: "Crea el evento",
    texto:
      "Nombre, fechas, recinto, servicios y los tipos de puesto que ofreces (emprendedor, comida, merchandising), cada uno con su precio y cupo.",
  },
  {
    icono: MapPinned,
    titulo: "Sube el plano y marca los puestos",
    texto:
      "Sube una imagen del plano del recinto y marca cada puesto directamente sobre ella. Queda numerado y listo para que la gente postule a un lugar específico.",
  },
  {
    icono: CheckCircle2,
    titulo: "Publica el evento",
    texto: "Mientras no lo publiques, queda como borrador y nadie más lo ve.",
  },
  {
    icono: ClipboardList,
    titulo: "Revisa las postulaciones",
    texto:
      "Aprueba o rechaza cada solicitud. Si activaste \"requiere aceptar antes del pago\" en el evento, primero aceptas al postulante y luego confirmas cuando suba su comprobante.",
  },
  {
    icono: Banknote,
    titulo: "Registra tus cuentas de transferencia",
    texto:
      "Si usas el flujo de aceptación previa, carga tus cuentas bancarias en \"Cuentas de transferencia\" — el postulante las ve recién después de ser aceptado.",
  },
] as const;

const PASOS_EMPRENDEDOR = [
  {
    icono: Store,
    titulo: "Crea tu cuenta como emprendedor",
    texto: "Al registrarte, elige \"Emprendedor\".",
  },
  {
    icono: Search,
    titulo: "Explora los eventos",
    texto: "En la página principal ves todas las ferias publicadas, sin necesidad de iniciar sesión.",
  },
  {
    icono: MapPinned,
    titulo: "Postula",
    texto:
      "Si el evento tiene plano, elige tu puesto directo sobre la imagen (los ocupados aparecen bloqueados). Completa tus datos, tu RUT y qué categorías de producto vendes.",
  },
  {
    icono: Upload,
    titulo: "Sube tu comprobante",
    texto:
      "Si el puesto es pago, adjunta el comprobante de transferencia al postular. Si el evento requiere aceptación previa, espera a que te acepten para ver los datos bancarios y subirlo después, desde \"Mis postulaciones\".",
  },
  {
    icono: ClipboardList,
    titulo: "Revisa el estado en \"Mis postulaciones\"",
    texto: "Ahí ves si sigue pendiente, fue aceptada, aprobada o rechazada, y te avisamos dentro de la app apenas cambie.",
  },
  {
    icono: CheckCircle2,
    titulo: "Listo",
    texto: "Cuando el organizador confirma tu pago, tu puesto queda aprobado.",
  },
] as const;

export function Pasos() {
  const [tab, setTab] = useState<"organizador" | "emprendedor">("emprendedor");
  const pasos = tab === "organizador" ? PASOS_ORGANIZADOR : PASOS_EMPRENDEDOR;

  return (
    <div>
      <div className="inline-flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setTab("emprendedor")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "emprendedor"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Soy emprendedor
        </button>
        <button
          type="button"
          onClick={() => setTab("organizador")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === "organizador"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Soy organizador
        </button>
      </div>

      <ol className="mt-8 space-y-6">
        {pasos.map((paso, i) => {
          const Icono = paso.icono;
          return (
            <li key={paso.titulo} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                {i < pasos.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-2">
                <h3 className="flex items-center gap-1.5 font-medium">
                  <Icono className="size-4 text-primary" />
                  {paso.titulo}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{paso.texto}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
