import { AlertTriangle } from "lucide-react";
import { WarningBanner } from "@/components/WarningBanner";
import { useTranslation } from "@/i18n";

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
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <WarningBanner
      icon={AlertTriangle}
      message={t("stale.warning")}
      action={onRetry ? { label: t("stale.retry"), onClick: onRetry } : undefined}
    />
  );
}
