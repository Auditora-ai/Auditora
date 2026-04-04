import type { PropsWithChildren } from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escaneo Gratuito de Riesgo Operativo | Auditora.ai",
  description:
    "Escanea cualquier sitio web en 60 segundos. Obtén un análisis gratuito de riesgo operativo con mapeo de procesos y puntuación de vulnerabilidad.",
};

export default function ScanLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050A15] via-[#0A1428] to-[#0F2847] text-white">
      {/* Minimal header */}
      <header className="relative z-50 flex items-center justify-between px-6 py-4 lg:px-10">
        <Link
          href={process.env.NEXT_PUBLIC_MARKETING_URL ?? "/"}
          className="flex items-center transition-opacity hover:opacity-80"
        >
          {/* Inline wordmark matching Logo but forced white for dark bg */}
          <span className="text-xl tracking-tight leading-none">
            <span className="font-black text-white">Audit</span>
            <span className="font-light text-white/70">ora</span>
            <span className="font-light text-[#3B8FE8]">.ai</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-lg bg-[#3B8FE8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2E7FD6]"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="relative">{children}</main>
    </div>
  );
}
