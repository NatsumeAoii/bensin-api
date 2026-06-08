import { Link } from "react-router";
import { MapPin, ArrowLeft } from "lucide-react";
import { useDocumentTitle } from "@/utils/use-document-title";

/**
 * 404 Not Found page — displayed when no route matches.
 * Offers a clear message and a link back to the home page.
 */
export default function NotFoundPage() {
  useDocumentTitle("Halaman Tidak Ditemukan");

  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950/50 dark:to-red-950/50">
          <MapPin
            className="h-10 w-10 text-orange-500 dark:text-orange-400"
            aria-hidden="true"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
            404
          </h1>
          <p className="text-base font-medium text-stone-700 dark:text-stone-300">
            Halaman tidak ditemukan
          </p>
          <p className="max-w-xs text-sm text-stone-500 dark:text-stone-400">
            Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
          </p>
        </div>

        {/* CTA */}
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
