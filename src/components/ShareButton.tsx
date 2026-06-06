import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
}

/**
 * Share button — uses native Web Share API when available,
 * falls back to copying the URL to clipboard.
 */
export function ShareButton({ title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

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
        // User cancelled or share failed — fall through to clipboard
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no action needed
    }
  }

  const Icon = copied ? Check : Share2;
  const label = copied ? "Link disalin" : "Bagikan";

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-orange-700 dark:hover:bg-orange-950/30 dark:hover:text-orange-400"
    >
      <Icon size={14} aria-hidden="true" />
      {copied ? (
        <span className="text-emerald-600 dark:text-emerald-400">Disalin</span>
      ) : (
        <span>Bagikan</span>
      )}
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
