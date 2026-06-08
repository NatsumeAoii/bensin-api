import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

/**
 * Content-Security-Policy for the production build. GitHub Pages cannot set
 * response headers, so the policy ships as a <meta> tag. It is injected only
 * into the build output — NOT the dev server, where Vite's HMR needs inline
 * scripts and websocket connections that a strict CSP would block.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // Tailwind/inline product-color styles require 'unsafe-inline' for styles.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self' https://nasgunawann.github.io",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function cspPlugin(): Plugin {
  return {
    name: "inject-csp-meta",
    apply: "build",
    transformIndexHtml(html) {
      const tag = `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`;
      return html.replace(/<head>/, `<head>\n    ${tag}`);
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/bensin-api/" : "/",
  plugins: [react(), tailwindcss(), cspPlugin()],
  css: {
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            // Isolate the icon library so its weight doesn't invalidate the
            // core vendor chunk when app code changes.
            if (id.includes("lucide-react")) {
              return "icons";
            }
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-router/") ||
              id.includes("/zustand/")
            ) {
              return "vendor";
            }
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
}));
