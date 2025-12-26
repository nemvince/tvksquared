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

const makeTypedEnvironment = <T>(schema: { parse: (v: unknown) => T }) => {
  return camelKeys(schema.parse(Bun.env));
};

export const env = makeTypedEnvironment(envSchema);
