"use client";

import { config } from "@config";
import { Button } from "@repo/ui/components/button";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";

interface EmailGateProps {
  toolSlug: string;
  result: Record<string, unknown> | null;
  locale: string;
  onClose: () => void;
}

export function EmailGate({ toolSlug, result, locale, onClose }: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEs = locale === "es";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.includes("@") || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch(
          `${config.saasUrl}/api/public/tools/lead-capture`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              toolUsed: toolSlug,
              outputData: result,
            }),
          },
        );

        if (!res.ok) throw new Error("Failed");
        setSuccess(true);

        // Auto-download after 1.5s
        setTimeout(() => {
          triggerDownload();
          onClose();
        }, 1500);
      } catch {
        setError(
          isEs
            ? "Error al guardar. Intenta de nuevo."
            : "Failed to save. Try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, isSubmitting, toolSlug, result, isEs, onClose],
  );

  const triggerDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aiprocess-${toolSlug}-result.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, toolSlug]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {success ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {isEs ? "Descargando..." : "Downloading..."}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEs
                ? "Te enviaremos tips sobre documentacion de procesos."
                : "We'll send you tips on process documentation."}
            </p>
          </div>
        ) : (
          <>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {isEs
                ? "Ingresa tu email para descargar"
                : "Enter your email to download"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {isEs
                ? "Recibirás tu resultado y consejos sobre documentación de procesos."
                : "You'll receive your result and process documentation tips."}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  isEs ? "tu@email.com" : "you@email.com"
                }
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !email.includes("@")}
              >
                {isSubmitting ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : isEs ? (
                  "Descargar gratis"
                ) : (
                  "Download free"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
