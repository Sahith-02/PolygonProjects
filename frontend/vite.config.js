import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "public/_redirects", // 👈 this is the fix
          dest: ".", // 👈 copy to root of dist/
        },
      ],
    }),
  ],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
  base: "/",
});
