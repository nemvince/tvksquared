import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  article: ["create", "read", "readUnpublished", "update", "delete"],
  comment: ["create", "read", "update", "delete", "moderate"],
} as const;

export const ac = createAccessControl(statement);

const muted = ac.newRole({
  article: ["read"],
  comment: ["read"],
});

const user = ac.newRole({
  article: ["read"],
  comment: ["create", "read"],
});

const moderator = ac.newRole({
  article: ["read", "readUnpublished"],
  comment: ["create", "read", "moderate", "delete"],
});

const admin = ac.newRole({
  article: ["create", "read", "readUnpublished", "update", "delete"],
  comment: ["create", "read", "update", "delete", "moderate"],
  ...adminAc.statements,
});

export const roles = {
  muted,
  user,
  moderator,
  admin,
};
