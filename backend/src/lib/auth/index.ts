import { db } from "@backend/db";
import { authSchema } from "@backend/db/schema/auth";
import { ac, roles } from "@backend/lib/auth/rbac";
import { env } from "@backend/lib/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
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
  plugins: [
    admin({
      ac,
      roles,
    }),
  ],
});
