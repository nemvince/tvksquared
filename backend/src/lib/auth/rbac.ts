import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultRoles,
  defaultStatements,
} from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  article: ["create", "read", "readUnpublished", "update", "delete"],
  comment: ["create", "read", "update", "delete", "moderate"],
  reaction: ["create", "read", "delete"],
} as const;

export const ac = createAccessControl(statement);

const mutedRole = ac.newRole({
  article: ["read"],
  comment: ["read"],
  reaction: ["read"],
});

const userRole = ac.newRole({
  article: ["read"],
  comment: ["create", "read"],
  reaction: ["create", "read", "delete"],
  ...defaultRoles.user.statements,
});

const moderatorRole = ac.newRole({
  article: ["read", "readUnpublished"],
  comment: ["create", "read", "moderate", "delete"],
  reaction: ["create", "read", "delete"],
  ...defaultRoles.user.statements,
});

const adminRole = ac.newRole({
  article: ["create", "read", "readUnpublished", "update", "delete"],
  comment: ["create", "read", "update", "delete", "moderate"],
  reaction: ["create", "read", "delete"],
  ...defaultRoles.admin.statements,
});

export const roles = {
  muted: mutedRole,
  user: userRole,
  moderator: moderatorRole,
  admin: adminRole,
};
