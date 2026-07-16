export type Locale = "id" | "en";

export type TranslationKey = keyof typeof translations.id;

const translations = {
  id: {
    // Navigation
    "nav.provinces": "Provinsi",
    "nav.national": "Nasional",
    "nav.changes": "Perubahan",
    "nav.map": "Peta",
    "nav.more": "Lainnya",
    "nav.home": "Beranda",
    "nav.homeLabel": "Beranda - Harga BBM Indonesia",

    // Layout
    "layout.skipToMain": "Lewati ke konten utama",
    "layout.mainNav": "Navigasi utama",
    "layout.mobileNav": "Navigasi mobile",

    // Province List Page
    "home.title": "Harga BBM Indonesia",
    "home.subtitle": "Data terbaru dari Pertamina",
    "home.provinceCount": "{count} Provinsi",
    "home.updated": "Diperbarui {time}",

    // Search
    "search.placeholder": "Cari provinsi...",
    "search.label": "Cari provinsi",
    "search.noResults": "Tidak ada provinsi yang cocok dengan pencarian.",
    "search.clearFilter": "Hapus filter",

    // Province Detail
    "detail.updated": "Diperbarui {time}",
    "detail.productCount": "{count} produk",
    "detail.noData": "Tidak ada data harga untuk provinsi ini",
    "detail.breadcrumb": "Provinsi",

    // National Page
    "national.title": "Perbandingan Nasional",
    "national.provinceCount": "{count} provinsi",
    "national.updated": "Diperbarui {time}",
    "national.selectProduct": "Pilih produk BBM",
    "national.products": "Produk BBM",
    "national.pricePerProvince": "Harga {product} per provinsi",
    "national.cheapest": "Termurah",
    "national.mostExpensive": "Termahal",
    "national.cheapestPrice": "Termurah: {price}",
    "national.mostExpensivePrice": "Termahal: {price}",
    "national.sortDesc": "Urutkan mahal ke murah",
    "national.sortAsc": "Urutkan murah ke mahal",
    "national.groupByRegion": "Kelompokkan per pulau",
    "national.averagePrice": "Rata-rata: {price}",
    "national.filterAll": "Semua",
    "national.filterAvailable": "Tersedia",
    "national.filterUnavailable": "Tidak Tersedia",

    // Price / Availability
    "price.available": "Tersedia",
    "price.unavailable": "Tidak Tersedia",
    "price.unknown": "Tidak Diketahui",
    "price.unavailable_short": "Tidak Tersedia",

    // Theme
    "theme.switchToDark": "Ganti ke mode gelap",
    "theme.switchToLight": "Ganti ke mode terang",

    // Refresh
    "refresh.label": "Perbarui data",

    // Share
    "share.label": "Bagikan",
    "share.copied": "Disalin",
    "share.linkCopied": "Link disalin",
    "share.copyFailed": "Gagal menyalin",
    "share.copyLinkFailed": "Gagal menyalin link",
    "share.title": "Harga BBM {province}",
    "share.text": "Lihat harga BBM terbaru di {province}",

    // Error
    "error.title": "Terjadi Kesalahan",
    "error.retry": "Coba Lagi",
    "error.retryLater": "Coba lagi nanti",
    "error.loadFailed": "Gagal memuat data",
    "error.appProblem": "Aplikasi mengalami masalah",
    "error.unexpected":
      "Terjadi kesalahan tak terduga. Muat ulang halaman untuk melanjutkan.",
    "error.reload": "Muat Ulang",
    "error.loadHistory": "Gagal memuat riwayat harga",

    // Stale / Warning
    "stale.lastUpdated": "Data terakhir diperbarui {time}",
    "stale.warning":
      "Data mungkin sudah tidak terbaru. Periksa koneksi internet Anda.",
    "stale.retry": "Coba lagi",

    // Loading
    "loading.provinceList": "Memuat daftar provinsi",
    "loading.data": "Memuat data...",

    // Empty
    "empty.noResults": "Tidak ada data",

    // Not Found
    "notFound.title": "Halaman Tidak Ditemukan",
    "notFound.heading": "Halaman tidak ditemukan",
    "notFound.description":
      "Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.",
    "notFound.backHome": "Kembali ke Beranda",
    "notFound.provinceTitle": "Provinsi tidak ditemukan",
    "notFound.provinceDesc": "Data untuk provinsi ini tidak tersedia.",
    "notFound.backToList": "Kembali ke daftar provinsi",

    // History
    "history.title": "Riwayat Harga",
    "history.timeRange": "Rentang waktu",
    "history.selectProduct": "Pilih produk",
    "history.notAvailable": "Riwayat harga belum tersedia",
    "history.notAvailableDesc":
      "Data riwayat mulai terkumpul sejak fitur ini aktif dan akan bertambah setiap kali harga berubah.",
    "history.1month": "1 Bulan",
    "history.3months": "3 Bulan",
    "history.1year": "1 Tahun",
    "history.all": "Semua",
    "history.dataPoints": "{count} titik perubahan",
    "history.singlePoint": "1 titik — harga belum berubah",
    "history.startPrice": "Harga awal",
    "history.endPrice": "Harga terakhir",
    "history.export": "Unduh CSV",
    "history.showTable": "Tampilkan data dalam tabel",
    "history.hideTable": "Sembunyikan tabel",
    "history.date": "Tanggal",
    "history.price": "Harga",
    "history.change": "Perubahan",

    // Changes feed
    "changes.title": "Riwayat Perubahan Harga",
    "changes.totalChanges": "{count} perubahan",
    "changes.dateRange": "Rentang waktu",
    "changes.7days": "7 Hari",
    "changes.30days": "30 Hari",
    "changes.allTime": "Semua",
    "changes.searchProvince": "Cari provinsi...",
    "changes.empty": "Belum ada perubahan harga yang tercatat",

    // Footer
    "footer.description":
      "Data harga BBM bersumber dari MyPertamina dan diperbarui secara otomatis setiap jam. Proyek open-source untuk kepentingan publik.",
    "footer.viewGithub": "Lihat di GitHub",
    "footer.dataSource": "Sumber data: MyPertamina \u00b7 API publik gratis",

    // Stats
    "stats.provinces": "{count} Provinsi",
    "stats.provinceCount": "{count} provinsi",

    // Data change announcer
    "announce.provinceUpdated": "Data harga {province} telah diperbarui",
    "announce.nationalUpdated": "Data diperbarui. {count} provinsi tersedia.",

    // Chart
    "chart.noChanges": "Tidak ada perubahan harga pada rentang ini.",
    "chart.ariaLabel":
      "Grafik riwayat harga {product}. {count} titik perubahan, dari {min} hingga {max}.",
    "chart.latestPrice": "Harga terkini: {price}",

    // Province navigation
    "nav.prevProvince": "Provinsi sebelumnya: {name}",
    "nav.nextProvince": "Provinsi berikutnya: {name}",
    "nav.provinceCounter": "{current} / {total}",

    // Bookmarks
    "bookmark.save": "Simpan provinsi",
    "bookmark.remove": "Hapus dari simpanan",
    "bookmark.section": "Provinsi Tersimpan",
    "bookmark.clearAll": "Hapus semua",
    "bookmark.clearConfirm": "Hapus semua provinsi tersimpan?",
    "bookmark.count": "{count} tersimpan",
    "bookmark.shareLabel": "Bagikan tersimpan",

    // Price unavailable label
    "price.unavailableLabel": "Tidak Tersedia",
  },
  en: {
    // Navigation
    "nav.provinces": "Provinces",
    "nav.national": "National",
    "nav.changes": "Changes",
    "nav.map": "Map",
    "nav.more": "More",
    "nav.home": "Home",
    "nav.homeLabel": "Home - Indonesian Fuel Prices",

    // Layout
    "layout.skipToMain": "Skip to main content",
    "layout.mainNav": "Main navigation",
    "layout.mobileNav": "Mobile navigation",

    // Province List Page
    "home.title": "Indonesian Fuel Prices",
    "home.subtitle": "Latest data from Pertamina",
    "home.provinceCount": "{count} Provinces",
    "home.updated": "Updated {time}",

    // Search
    "search.placeholder": "Search province...",
    "search.label": "Search province",
    "search.noResults": "No provinces match your search.",
    "search.clearFilter": "Clear filter",

    // Province Detail
    "detail.updated": "Updated {time}",
    "detail.productCount": "{count} products",
    "detail.noData": "No price data available for this province",
    "detail.breadcrumb": "Provinces",

    // National Page
    "national.title": "National Comparison",
    "national.provinceCount": "{count} provinces",
    "national.updated": "Updated {time}",
    "national.selectProduct": "Select fuel product",
    "national.products": "Fuel Products",
    "national.pricePerProvince": "{product} price per province",
    "national.cheapest": "Cheapest",
    "national.mostExpensive": "Most Expensive",
    "national.cheapestPrice": "Cheapest: {price}",
    "national.mostExpensivePrice": "Most Expensive: {price}",
    "national.sortDesc": "Sort expensive to cheap",
    "national.sortAsc": "Sort cheap to expensive",
    "national.groupByRegion": "Group by island",
    "national.averagePrice": "Average: {price}",
    "national.filterAll": "All",
    "national.filterAvailable": "Available",
    "national.filterUnavailable": "Unavailable",

    // Price / Availability
    "price.available": "Available",
    "price.unavailable": "Unavailable",
    "price.unknown": "Unknown",
    "price.unavailable_short": "Unavailable",

    // Theme
    "theme.switchToDark": "Switch to dark mode",
    "theme.switchToLight": "Switch to light mode",

    // Refresh
    "refresh.label": "Refresh data",

    // Share
    "share.label": "Share",
    "share.copied": "Copied",
    "share.linkCopied": "Link copied",
    "share.copyFailed": "Copy failed",
    "share.copyLinkFailed": "Failed to copy link",
    "share.title": "Fuel Prices in {province}",
    "share.text": "See latest fuel prices in {province}",

    // Error
    "error.title": "An Error Occurred",
    "error.retry": "Try Again",
    "error.retryLater": "Try again later",
    "error.loadFailed": "Failed to load data",
    "error.appProblem": "Application encountered a problem",
    "error.unexpected":
      "An unexpected error occurred. Reload the page to continue.",
    "error.reload": "Reload",
    "error.loadHistory": "Failed to load price history",

    // Stale / Warning
    "stale.lastUpdated": "Data last updated {time}",
    "stale.warning": "Data may be outdated. Check your internet connection.",
    "stale.retry": "Retry",

    // Loading
    "loading.provinceList": "Loading province list",
    "loading.data": "Loading data...",

    // Empty
    "empty.noResults": "No data",

    // Not Found
    "notFound.title": "Page Not Found",
    "notFound.heading": "Page not found",
    "notFound.description":
      "The page you are looking for is not available or has been moved.",
    "notFound.backHome": "Back to Home",
    "notFound.provinceTitle": "Province not found",
    "notFound.provinceDesc": "Data for this province is not available.",
    "notFound.backToList": "Back to province list",

    // History
    "history.title": "Price History",
    "history.timeRange": "Time range",
    "history.selectProduct": "Select product",
    "history.notAvailable": "Price history not yet available",
    "history.notAvailableDesc":
      "History data has been collected since this feature was activated and will grow each time prices change.",
    "history.1month": "1 Month",
    "history.3months": "3 Months",
    "history.1year": "1 Year",
    "history.all": "All",
    "history.dataPoints": "{count} data points",
    "history.singlePoint": "1 data point — price hasn't changed",
    "history.startPrice": "Start price",
    "history.endPrice": "End price",
    "history.export": "Download CSV",
    "history.showTable": "Show data in table",
    "history.hideTable": "Hide table",
    "history.date": "Date",
    "history.price": "Price",
    "history.change": "Change",

    // Changes feed
    "changes.title": "Price Change History",
    "changes.totalChanges": "{count} changes",
    "changes.dateRange": "Date range",
    "changes.7days": "7 Days",
    "changes.30days": "30 Days",
    "changes.allTime": "All",
    "changes.searchProvince": "Search province...",
    "changes.empty": "No price changes recorded yet",

    // Footer
    "footer.description":
      "Fuel price data sourced from MyPertamina and updated automatically every hour. An open-source project for public benefit.",
    "footer.viewGithub": "View on GitHub",
    "footer.dataSource": "Data source: MyPertamina \u00b7 Free public API",

    // Stats
    "stats.provinces": "{count} Provinces",
    "stats.provinceCount": "{count} provinces",

    // Data change announcer
    "announce.provinceUpdated": "{province} price data has been updated",
    "announce.nationalUpdated": "Data updated. {count} provinces available.",

    // Chart
    "chart.noChanges": "No price changes in this range.",
    "chart.ariaLabel":
      "Price history chart for {product}. {count} data points, from {min} to {max}.",
    "chart.latestPrice": "Latest price: {price}",

    // Province navigation
    "nav.prevProvince": "Previous province: {name}",
    "nav.nextProvince": "Next province: {name}",
    "nav.provinceCounter": "{current} / {total}",

    // Bookmarks
    "bookmark.save": "Save province",
    "bookmark.remove": "Remove from saved",
    "bookmark.section": "Saved Provinces",
    "bookmark.clearAll": "Clear all",
    "bookmark.clearConfirm": "Remove all saved provinces?",
    "bookmark.count": "{count} saved",
    "bookmark.shareLabel": "Share saved",

    // Price unavailable label
    "price.unavailableLabel": "Unavailable",
  },
} as const;

export { translations };

/**
 * Resolves a translation key with optional interpolation parameters.
 * Falls back to Indonesian if key is missing in the target locale.
 */
export function resolveTranslation(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const value =
    (translations[locale] as Record<string, string>)[key] ??
    (translations.id as Record<string, string>)[key] ??
    key;

  if (!params) return value;

  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`
  );
}
