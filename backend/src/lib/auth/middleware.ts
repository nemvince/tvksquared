import { base } from "@backend/context";
import { auth } from "@backend/lib/auth";
import { ORPCError } from "@orpc/server";

export const authMiddleware = base.middleware(async ({ context, next }) => {
  const sessionData = await auth.api.getSession({
    headers: context.headers,
  });

  if (!(sessionData?.session && sessionData?.user)) {
    return next({
      context: {},
    });
  }

  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});

export const protectMiddleware = base.middleware(({ context, next }) => {
  if (!(context.session && context.user)) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      session: context.session,
      user: context.user,
    },
  });
});
