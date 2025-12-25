import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "@/server/db";
import { authSchema } from "@/server/db/schema/auth";
import { ac, roles } from "@/server/lib/auth/rbac";
import { env } from "@/server/lib/env";

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
