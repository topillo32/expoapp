"use client";

import { useState } from "react";
import { Receipt, X } from "lucide-react";

export function ComprobanteLightbox({ url }: { url: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
      >
        <Receipt className="size-3.5" />
        Ver comprobante de pago
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setAbierto(false)}
        >
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Comprobante de pago"
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
