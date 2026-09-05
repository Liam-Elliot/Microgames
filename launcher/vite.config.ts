import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5170 },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
