/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, Component, type ReactNode } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { ErrorState } from "@/components/ErrorState";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Layout } from "@/components/Layout";

/**
 * Retryable lazy import — wraps a dynamic import with retry logic
 * so that chunk load failures (CDN blip, flaky network) can be recovered.
 */
function lazyWithRetry(importFn: () => Promise<{ default: React.ComponentType }>) {
  return React.lazy(() =>
    importFn().catch(() => {
      return new Promise<{ default: React.ComponentType }>((resolve, reject) => {
        setTimeout(() => {
          importFn().then(resolve).catch(reject);
        }, 1000);
      });
    })
  );
}

const ProvinceListPage = lazyWithRetry(
  () => import("@/pages/ProvinceListPage")
);
const ProvinceDetailPage = lazyWithRetry(
  () => import("@/pages/ProvinceDetailPage")
);
const NationalPage = lazyWithRetry(
  () => import("@/pages/NationalPage")
);
const NotFoundPage = lazyWithRetry(
  () => import("@/pages/NotFoundPage")
);

/**
 * Suspense fallback — shows skeleton loader while route chunk is downloading.
 */
function RouteFallback() {
  return (
    <div className="p-4">
      <SkeletonLoader count={6} />
    </div>
  );
}

/**
 * Error boundary that catches lazy chunk load failures.
 */
interface ChunkErrorBoundaryProps {
  children: ReactNode;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
}

class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  state: ChunkErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChunkErrorBoundaryState {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message="Gagal memuat halaman"
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Wraps a lazy-loaded page component in Suspense + ChunkErrorBoundary.
 */
function LazyRoute({ element }: { element: ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        {element}
      </Suspense>
    </ChunkErrorBoundary>
  );
}

/**
 * Root layout — renders ScrollToTop + Layout shell with Outlet.
 */
function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/",
            element: <LazyRoute element={<ProvinceListPage />} />,
          },
          {
            path: "/provinsi/:slug",
            element: <LazyRoute element={<ProvinceDetailPage />} />,
          },
          {
            path: "/nasional",
            element: <LazyRoute element={<NationalPage />} />,
          },
          {
            path: "*",
            element: <LazyRoute element={<NotFoundPage />} />,
          },
        ],
      },
    ],
  },
]);
