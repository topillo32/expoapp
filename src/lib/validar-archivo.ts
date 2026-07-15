const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

function coincide(cabecera: Uint8Array, firma: number[], offset = 0): boolean {
  return firma.every((byte, i) => cabecera[offset + i] === byte);
}

// El navegador reporta `File.type`/la extensión a partir del nombre del
// archivo, no de su contenido: renombrar un .html a .png alcanza para
// pasarse por una imagen. Por eso la validación real se hace leyendo los
// primeros bytes y comparando contra la firma binaria de cada formato.
async function esImagenValida(archivo: File): Promise<boolean> {
  const cabecera = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());

  return (
    coincide(cabecera, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
    coincide(cabecera, [0xff, 0xd8, 0xff]) || // JPEG
    coincide(cabecera, [0x47, 0x49, 0x46, 0x38]) || // GIF87a / GIF89a
    (coincide(cabecera, [0x52, 0x49, 0x46, 0x46]) && coincide(cabecera, [0x57, 0x45, 0x42, 0x50], 8)) // WEBP
  );
}

export async function validarImagen(archivo: File): Promise<string | null> {
  if (archivo.size === 0) {
    return "Selecciona un archivo.";
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return "La imagen no puede pesar más de 5MB.";
  }
  if (!(await esImagenValida(archivo))) {
    return "El archivo debe ser una imagen real (PNG, JPG, WEBP o GIF).";
  }
  return null;
}

export function extensionSegura(nombreArchivo: string, porDefecto = "jpg"): string {
  const ext = (nombreArchivo.split(".").pop() ?? porDefecto).toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : porDefecto;
}
