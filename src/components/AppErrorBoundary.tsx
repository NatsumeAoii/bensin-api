import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level error boundary — catches any uncaught render error anywhere
 * in the component tree and shows a recoverable fallback instead of a
 * blank white screen. Reloading is offered as the recovery action since
 * the React tree state may be corrupted.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    // Log for diagnostics — no PII, just the error itself.
    console.error("Uncaught application error:", error);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
        <div
          role="alert"
          className="flex max-w-md flex-col items-center gap-5 rounded-2xl border border-red-200 bg-red-50/50 p-10 text-center dark:border-red-900/40 dark:bg-red-950/20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50">
            <AlertTriangle
              className="h-8 w-8 text-red-500 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-stone-800 dark:text-stone-200">
              Aplikasi mengalami masalah
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Terjadi kesalahan tak terduga. Muat ulang halaman untuk melanjutkan.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all hover:shadow-lg hover:shadow-orange-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }
}
