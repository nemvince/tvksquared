import { ORPCError } from "@orpc/server";
import type { InferSelectModel } from "drizzle-orm";
import { base } from "@/server/context";
import { db } from "@/server/db";
import {
  articleSelectSchema,
  type comment,
  commentSelectSchema,
  tagSelectSchema,
} from "@/server/db/schema/blog";
import { auth } from "@/server/lib/auth";
import { authMiddleware } from "@/server/lib/auth/middleware";

const redactDeletedComments = (
  comments: InferSelectModel<typeof comment>[]
) => {
  return comments.map((comment) => {
    if (comment.deleted) {
      return { ...comment, content: "" };
    }
    return comment;
  });
};

export const getOne = base
  .use(authMiddleware)
  .input(articleSelectSchema.pick({ id: true }))
  .output(
    articleSelectSchema.extend({
      tags: tagSelectSchema
        .pick({
          id: true,
          name: true,
          slug: true,
        })
        .array(),
      comments: commentSelectSchema.array(),
    })
  )
  .handler(async ({ context }) => {
    const article = await db.query.article.findFirst({
      where: { id: {} },
      with: {
        tags: {
          columns: { id: true, name: true, slug: true },
        },
        comments: true,
      },
    });

    if (!article) {
      throw new ORPCError("NOT_FOUND");
    }

    if (!(article.published || context.user)) {
      throw new ORPCError("NOT_FOUND");
    }

    if (!context.user) {
      throw new ORPCError("NOT_FOUND");
    }

    const canReadUnpublished = await auth.api.userHasPermission({
      body: {
        userId: context.user.id,
        permission: { article: ["readUnpublished"] },
      },
    });
    if (canReadUnpublished.error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
    if (!canReadUnpublished.success) {
      throw new ORPCError("NOT_FOUND");
    }

    const canModerateComments = await auth.api.userHasPermission({
      body: {
        userId: context.user.id,
        permission: { comment: ["moderate"] },
      },
    });
    if (canModerateComments.error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    if (canModerateComments.success) {
      return article;
    }

    return {
      ...article,
      comments: redactDeletedComments(article.comments),
    };
  });
