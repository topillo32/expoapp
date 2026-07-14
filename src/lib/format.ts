const formatoFecha = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
});

const formatoFechaConAnio = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatoPrecio = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatearPrecio(monto: number): string {
  return formatoPrecio.format(monto);
}

function aFechaLocal(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function formatearFecha(iso: string): string {
  return formatoFechaConAnio.format(aFechaLocal(iso));
}

export function formatearRangoFechas(inicioIso: string, finIso: string): string {
  const inicio = aFechaLocal(inicioIso);
  const fin = aFechaLocal(finIso);

  if (inicioIso === finIso) {
    return formatoFechaConAnio.format(inicio);
  }

  return `${formatoFecha.format(inicio)} - ${formatoFechaConAnio.format(fin)}`;
}
