import { AlertTriangle } from "lucide-react";
import { WarningBanner } from "@/components/WarningBanner";

interface StaleDataBannerProps {
  visible: boolean;
  /** Optional retry handler — when provided, an inline retry button is shown. */
  onRetry?: () => void;
}

/**
 * Shown when a refresh failed but stale data is still on screen. Offers an
 * inline retry so the user has a recovery action, not just a warning.
 */
export function StaleDataBanner({ visible, onRetry }: StaleDataBannerProps) {
  if (!visible) return null;

  return (
    <WarningBanner
      icon={AlertTriangle}
      message="Data mungkin sudah tidak terbaru. Periksa koneksi internet Anda."
      action={onRetry ? { label: "Coba lagi", onClick: onRetry } : undefined}
    />
  );
}
