import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base:    "./",
  build:   { outDir: "dist" },
  server: {
    port: 5174,
    proxy: {
      /* forward /api/* and /health to MAXIMUS server in dev */
      "/api": {
        target:       "http://localhost:3001",
        changeOrigin: true,
      },
      "/health": {
        target:       "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
