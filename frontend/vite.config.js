import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    historyApiFallback: true,
  },
  build: {
    outDir: "dist",
  },
  // 👇 THIS IS THE FIX
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  base: "/",
  define: {
    "process.env": {},
  },
  // 👇 THIS IS THE IMPORTANT PART FOR RENDER DEPLOYMENT
  preview: {
    port: 4173,
  },
  // 👇 Tell Vite to fallback to index.html for all routes
});
