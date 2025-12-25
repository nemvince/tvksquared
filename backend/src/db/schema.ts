import { authSchema } from "@backend/db/schema/auth";
import { blogSchema } from "@backend/db/schema/blog";
export const schema = {
  ...authSchema,
  ...blogSchema,
};
