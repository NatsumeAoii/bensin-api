/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL for the static JSON API. Optional — defaults to the production
   * GitHub Pages deployment when unset. Override to point the dashboard at
   * locally generated `v1/` data during development.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
