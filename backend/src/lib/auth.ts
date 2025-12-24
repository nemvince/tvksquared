import { db } from "@backend/db";
import { authSchema } from "@backend/db/schema/auth";
import { env } from "@backend/lib/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  basePath: "/auth",
  baseURL: env.baseUrl,
  secret: env.authSecret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: authSchema,
  }),
  socialProviders: {
    github: {
      clientId: env.githubClientId,
      clientSecret: env.githubClientSecret,
    },
  },
});
