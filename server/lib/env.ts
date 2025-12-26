import { env as processEnv } from "bun";
import { camelKeys } from "string-ts";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  UPLOADS_PATH: z.string(),
  BASE_URL: z.string(),
  AUTH_SECRET: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
});

if (!envSchema.safeParse(processEnv).success) {
  throw new Error("Invalid environment variables", {
    cause: envSchema.safeParse(processEnv).error,
  });
}

const makeTypedEnvironment = <T>(schema: { parse: (v: unknown) => T }) => {
  return camelKeys(schema.parse(processEnv));
};

export const env = makeTypedEnvironment(envSchema);
