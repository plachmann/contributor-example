import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    env: {
      DATABASE_URL: "postgresql://gifting:gifting@localhost:5432/gifting",
      JWT_SECRET: "change-me",
      CORS_ORIGIN: "http://localhost:3000",
    },
  },
});
