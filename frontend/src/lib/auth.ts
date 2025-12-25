import { ac, roles } from "@backend/lib/auth/rbac";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles,
    }),
  ],
});
