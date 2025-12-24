import { env } from "@backend/lib/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: env.databaseUrl,
  },
  schema: "./src/db/schema",
  out: "./drizzle",
});
