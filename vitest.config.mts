import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@backend": path.resolve(import.meta.dirname, "./backend"),
      "@": path.resolve(import.meta.dirname, "./frontend"),
      "server-only": path.resolve(import.meta.dirname, "./backend/tests/mocks/server-only.ts"),
    },
  },
});
