import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // domínio e engines não precisam de DOM
    include: ["src/**/*.test.ts"],
  },
});
