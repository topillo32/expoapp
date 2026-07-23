function escaparCampoCsv(valor: string | number): string {
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

const BOM_UTF8 = String.fromCharCode(0xfeff);

// El BOM al inicio hace que Excel detecte UTF-8 y no rompa las tildes.
export function construirCsv(encabezados: string[], filas: (string | number)[][]): string {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(escaparCampoCsv).join(","));
  return BOM_UTF8 + lineas.join("\r\n");
}
