function escaparCampoCsv(valor: string | number): string {
  let texto = String(valor);
  // Un campo que empieza con =, +, -, @ puede interpretarse como formula al
  // abrir el CSV en Excel/Sheets (ej. un nombre de tienda "=cmd|...").
  // Anteponer una comilla simple lo fuerza a texto plano.
  if (/^[=+\-@]/.test(texto)) {
    texto = `'${texto}`;
  }
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
