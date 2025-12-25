import { authSchema } from "@/server/db/schema/auth";
import { blogSchema } from "@/server/db/schema/blog";
export const schema = {
  ...authSchema,
  ...blogSchema,
};
