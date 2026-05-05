import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

// HTTPS is only used by `vite` (dev server). Production builds (vite build)
// don't need it, and the PEM files aren't present on CI runners like
// Cloudflare Pages — so we only enable HTTPS when both files exist.
const KEY_PATH = "./localhost-key.pem";
const CERT_PATH = "./localhost.pem";
const httpsConfig =
  fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)
    ? {
        key: fs.readFileSync(KEY_PATH),
        cert: fs.readFileSync(CERT_PATH),
      }
    : undefined;

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react-router", "@googlemaps/js-api-loader"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "@googlemaps/js-api-loader",
    ],
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],

  server: {
    host: "0.0.0.0",
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    // HTTPS is enabled only when local mkcert PEM files are present:
    //   1. brew install mkcert nss
    //   2. mkcert -install
    //   3. cd ROOT_PATH/client && mkcert localhost
    // The *.pem files are gitignored. Without them, dev runs over HTTP.
    https: httpsConfig,
    // Proxy target switches by run mode:
    //   • Host (`pnpm dev` directly) → http://localhost:3000
    //   • Docker (`make up`) → http://server:3000 (compose service name)
    // The docker-compose client service sets PROXY_TARGET so this
    // resolves correctly without manual edits to vite.config.ts.
    proxy: (() => {
      const apiTarget = process.env.PROXY_TARGET ?? "http://localhost:3000";
      return {
        "/api": { target: apiTarget, changeOrigin: true },
        "/socket.io": { target: apiTarget, changeOrigin: true, ws: true },
        // Local-storage mode (no R2 vars): the server serves uploaded
        // images at /tmp/<filename> via express.static. Idle when R2 is
        // configured — image URLs point at R2_PUBLIC_URL instead.
        "/tmp": { target: apiTarget, changeOrigin: true },
      };
    })(),
  },
});
