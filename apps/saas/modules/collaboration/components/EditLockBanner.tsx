"use client";

import { AlertCircle } from "lucide-react";

interface EditLockBannerProps {
  lockedByName: string;
  section: string;
}

export function EditLockBanner({ lockedByName, section }: EditLockBannerProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 min-h-11">
      <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
      <p className="text-sm text-amber-200/90">
        <strong className="text-amber-200">{lockedByName}</strong> is editing the{" "}
        <span className="font-medium">{section}</span> section. Wait for them to release the lock.
      </p>
    </div>
  );
}
