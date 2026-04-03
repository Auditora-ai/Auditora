import type { PropsWithChildren } from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Operations Scan | Auditora.ai",
  description:
    "Scan any company website in 60 seconds. Get a free operational risk assessment with process mapping and vulnerability scoring.",
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
      </header>

      {/* Page content */}
      <main className="relative">{children}</main>
    </div>
  );
}
