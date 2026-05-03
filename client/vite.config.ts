import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";

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
    https: {
      // 1. brew install mkcert nss
      // 2. mkcert -install
      // 3. cd ROOT_PATH/client
      // 4. mkcert localhost
      // The *.pem files are ignored in .gitignore, you should have your own copy when developing.
      key: fs.readFileSync("./localhost-key.pem"),
      cert: fs.readFileSync("./localhost.pem"),
    },
    proxy: {
      "/api": {
        // Inside docker-compose, `server` resolves to the server container.
        // When running the client on the host, change this to http://localhost:3000.
        // target: "http://server:3000",
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Uploaded images are served by the server from server/tmp at /tmp.
      "/tmp": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Socket.IO endpoint — needs ws:true so the protocol upgrade goes
      // through. Long-poll fallback works without it but is much slower.
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
