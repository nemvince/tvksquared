import { defineConfig } from "drizzle-kit";
import { env } from "@/server/lib/env";

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: env.databaseUrl,
  },
  schema: "./src/db/schema",
  out: "./drizzle",
});
