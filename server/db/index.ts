import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { relations } from "@/server/db/relations";
import { schema } from "@/server/db/schema";
import { env } from "@/server/lib/env";

const sqlite = new Database(env.databaseUrl);
export const db = drizzle({ client: sqlite, schema, relations });
