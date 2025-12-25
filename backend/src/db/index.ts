import { Database } from "bun:sqlite";
import { relations } from "@backend/db/relations";
import { schema } from "@backend/db/schema";
import { env } from "@backend/lib/env";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database(env.databaseUrl);
export const db = drizzle({ client: sqlite, schema, relations });
