import { os } from "@orpc/server";
import type { Session, User } from "better-auth";

type Context = {
  headers: Headers;
  session?: Session;
  user?: User;
};

export const base = os.$context<Context>();
