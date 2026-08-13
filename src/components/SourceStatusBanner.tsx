import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { WarningBanner } from "@/components/WarningBanner";
import { useTranslation } from "@/i18n";
import { formatSyncTime } from "@/utils/date";

interface SourceStatusBannerProps {
  status?: "fresh" | "fallback";
  sourceSnapshotAt?: string | null;
}

export function SourceStatusBanner({
  status,
  sourceSnapshotAt,
}: SourceStatusBannerProps) {
  const { t, locale } = useTranslation();
  if (status === "fallback") {
    const snapshotDate = sourceSnapshotAt ? new Date(sourceSnapshotAt) : null;
    const hasValidSnapshotDate =
      snapshotDate !== null && !Number.isNaN(snapshotDate.getTime());
    const readableSnapshotTime = hasValidSnapshotDate
      ? formatSyncTime(sourceSnapshotAt as string, new Date(), locale)
      : t("freshness.unknownTime");

    return (
      <WarningBanner
        icon={AlertTriangle}
        message={t("freshness.fallback", {
          time: readableSnapshotTime,
        })}
      />
    );
  }
  if (status === "fresh") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"
      >
        <CheckCircle2 size={16} aria-hidden="true" />
        {t("freshness.fresh")}
      </div>
    );
  }
  return null;
}
