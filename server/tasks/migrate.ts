import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { defineTask } from "nitro/task";
import { db } from "@/server/db";

export default defineTask({
  meta: {
    name: "migrate",
    description: "Run database migrations",
  },
  run() {
    try {
      migrate(db, { migrationsFolder: "./drizzle" });
      return { result: "ok" };
    } catch {
      return { result: "error" };
    }
  },
});
