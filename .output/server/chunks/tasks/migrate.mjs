import { a as db, o as defineTask } from "../nitro/nitro.mjs";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
var migrate_default = defineTask({
	meta: {
		name: "migrate",
		description: "Run database migrations"
	},
	run() {
		try {
			migrate(db, { migrationsFolder: "./drizzle" });
			return { result: "ok" };
		} catch {
			return { result: "error" };
		}
	}
});
export { migrate_default as default };
