import { z } from "zod";
import { base } from "@/server/context";
import { db } from "@/server/db";
import { tagSelectSchema } from "@/server/db/schema/blog";
import { authMiddleware } from "@/server/lib/auth/middleware";

export const getAll = base
  .use(authMiddleware)
  .output(
    z.object({
      tags: tagSelectSchema
        .pick({
          id: true,
          name: true,
          slug: true,
        })
        .array(),
    })
  )
  .handler(async () => {
    const tags = await db.query.tag.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return {
      tags,
    };
  });
