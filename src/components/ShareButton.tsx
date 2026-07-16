import { useState } from "react";
import { Share2, Check, AlertCircle } from "lucide-react";
import { useTranslation } from "@/i18n";

interface ShareButtonProps {
  title: string;
  text: string;
}

type ShareStatus = "idle" | "copied" | "error";

/**
 * Share button — uses native Web Share API when available,
 * falls back to copying the URL to clipboard. Surfaces a brief error state if
 * both share and clipboard are unavailable, so the action is never silent.
 */
export function ShareButton({ title, text }: ShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const { t } = useTranslation();

  async function handleShare() {
    const shareData = {
      title,
      text,
      url: window.location.href,
    };

    // Use native share on supported platforms (mobile)
    if (navigator.share && canUseNativeShare()) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // User cancelled — not an error, just stop.
        if (error instanceof Error && error.name === "AbortError") return;
        // Otherwise fall through to clipboard fallback.
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      // Both Web Share and clipboard failed — tell the user instead of going silent.
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const config = {
    idle: { Icon: Share2, label: t("share.label"), srLabel: t("share.label") },
    copied: { Icon: Check, label: t("share.copied"), srLabel: t("share.linkCopied") },
    error: {
      Icon: AlertCircle,
      label: t("share.copyFailed"),
      srLabel: t("share.copyLinkFailed"),
    },
  }[status];

  const { Icon } = config;

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={config.srLabel}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-orange-700 dark:hover:bg-orange-950/30 dark:hover:text-orange-400"
    >
      <Icon size={14} aria-hidden="true" />
      <span
        className={
          status === "copied"
            ? "text-emerald-600 dark:text-emerald-400"
            : status === "error"
              ? "text-red-600 dark:text-red-400"
              : undefined
        }
      >
        {config.label}
      </span>
    </button>
  );
}

/**
 * Heuristic: native share is mainly useful on mobile/tablet.
 * On desktop, clipboard copy is more predictable.
 */
function canUseNativeShare(): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  // Use native share on touch devices (likely mobile)
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
