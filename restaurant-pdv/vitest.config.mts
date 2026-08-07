import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // guarda de build do Next.js — sem sentido fora do bundler dele.
      "server-only": path.resolve(__dirname, "./test/stubs/server-only.ts"),
    },
  },
});
