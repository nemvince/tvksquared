import { env as processEnv } from "bun";
import { t } from "elysia";
import { TypeCompiler } from "elysia/type-system";
import { camelKeys } from "string-ts";

const envSchema = t.Object({
  DATABASE_URL: t.String(),
  BASE_URL: t.String(),
  AUTH_SECRET: t.String(),
  GITHUB_CLIENT_ID: t.String(),
  GITHUB_CLIENT_SECRET: t.String(),
});

const validator = TypeCompiler.Compile(envSchema);

if (!validator.Check(processEnv)) {
  console.error("Invalid environment variables:", [
    ...validator.Errors(process.env),
  ]);
  process.exit(1);
}

export const env = camelKeys(processEnv);
