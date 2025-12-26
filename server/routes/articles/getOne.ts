import { ORPCError } from "@orpc/server";
import type { InferSelectModel } from "drizzle-orm";
import { base } from "@/server/context";
import { db } from "@/server/db";
import { userSelectSchema } from "@/server/db/schema/auth";
import {
  articleSelectSchema,
  type comment,
  commentSelectSchema,
  tagSelectSchema,
} from "@/server/db/schema/blog";
import { auth } from "@/server/lib/auth";
import { authMiddleware } from "@/server/lib/auth/middleware";

const redactDeletedComments = (
  comments: Array<InferSelectModel<typeof comment> & { author: { name: string; image: string | null } | null }>
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
  .input(articleSelectSchema.pick({ slug: true }))
  .output(
    articleSelectSchema.extend({
      author: userSelectSchema
        .pick({
          id: true,
          name: true,
          image: true,
        })
        .nullable(),
      tags: tagSelectSchema
        .pick({
          id: true,
          name: true,
          slug: true,
        })
        .array(),
      comments: commentSelectSchema
        .extend({
          author: userSelectSchema.pick({
            name: true,
            image: true,
          }).nullable(),
        })
        .array(),
    })
  )
  .handler(async ({ input, context }) => {
    const [article] = await db.query.article.findMany({
      where: {
        slug: {
          eq: input.slug,
        },
      },
      with: {
        author: {
          columns: { id: true, name: true, image: true },
        },
        tags: {
          columns: { id: true, name: true, slug: true },
        },
        comments: {
          with: {
            author: {
              columns: { name: true, image: true },
            },
          },
        },
      },
      limit: 1,
    });

    if (!article) {
      console.log("Article not found:", input.slug);
      throw new ORPCError("NOT_FOUND");
    }

    if (!context.user) {
      // If user is not authenticated, only return published articles
      if (!article.published) {
        console.log("Article not published:", input.slug);
        throw new ORPCError("NOT_FOUND");
      }
      return {
        ...article,
        comments: redactDeletedComments(article.comments),
      };
    }

    if (!article.published) {
      // If article is not published, check if user has permission to read unpublished articles
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
        console.log(
          "User cannot read unpublished articles:",
          context.user.id,
          article.published
        );
        throw new ORPCError("NOT_FOUND");
      }
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

    return {
      ...article,
      comments: canModerateComments.success
        ? article.comments
        : redactDeletedComments(article.comments),
    };
  });
