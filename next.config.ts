import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las imágenes (flyer/plano/comprobante) se validan hasta 5MB en
      // src/lib/validar-archivo.ts; el límite de Next por defecto es 1MB.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
