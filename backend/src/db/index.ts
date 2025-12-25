import { Database } from "bun:sqlite";
import { authRelations, authSchema } from "@backend/db/schema/auth";
import { blogRelations, blogSchema } from "@backend/db/schema/blog";
import { env } from "@backend/lib/env";
import { drizzle } from "drizzle-orm/bun-sqlite";

const schema = {
  ...authSchema,
  ...authRelations,
  ...blogSchema,
  ...blogRelations,
};

const sqlite = new Database(env.databaseUrl);
export const db = drizzle({ client: sqlite, schema });
