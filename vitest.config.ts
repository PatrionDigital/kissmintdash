/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "out", "**/node_modules/**"],
    globals: true,
    testTimeout: 10000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        ".next/",
        "out/",
        "tests/**",
      ],
    },
  },
  resolve: {
    alias: [
      { find: "@/", replacement: path.resolve(__dirname, "./") },
      { find: "@/app", replacement: path.resolve(__dirname, "./app") },
      { find: "@/components", replacement: path.resolve(__dirname, "./components") },
      { find: "@/lib", replacement: path.resolve(__dirname, "./lib") },
      { find: "@/services", replacement: path.resolve(__dirname, "./app/services") },
      { find: "@/styles", replacement: path.resolve(__dirname, "./styles") },
    ],
  },
});
