import { Database } from "bun:sqlite";
import { env } from "@backend/lib/env";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database(env.databaseUrl);
export const db = drizzle({ client: sqlite });
