import { AlertTriangle } from "lucide-react";

interface StaleDataBannerProps {
  visible: boolean;
}

export function StaleDataBanner({ visible }: StaleDataBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
        <AlertTriangle size={16} aria-hidden="true" className="text-amber-600 dark:text-amber-400" />
      </div>
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Data mungkin sudah tidak terbaru. Periksa koneksi internet Anda.
      </p>
    </div>
  );
}
