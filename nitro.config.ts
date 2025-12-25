import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  preset: "bun",
  experimental: {
    tasks: true,
  },
});
