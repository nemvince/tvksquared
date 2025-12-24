import { db } from "@backend/db";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

try {
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
} catch (e) {
  console.error("Migration failed:", e);
  process.exit(1);
}
