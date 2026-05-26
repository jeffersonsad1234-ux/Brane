import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/engine/",
  plugins: [react()],
  resolve: {
    alias: {
      "@editor": path.resolve(__dirname, "src/editor"),
      "@engine": path.resolve(__dirname, "src/engine"),
      "@runtime": path.resolve(__dirname, "src/runtime"),
      "@store": path.resolve(__dirname, "src/store"),
      "@components": path.resolve(__dirname, "src/components"),
      "@assets": path.resolve(__dirname, "assets"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
  },
});
