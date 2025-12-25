import { base } from "@backend/context";
import { db } from "@backend/db";
import { articleSelectSchema, tagSelectSchema } from "@backend/db/schema/blog";
import { auth } from "@backend/lib/auth";
import { authMiddleware } from "@backend/lib/auth/middleware";
import { ORPCError } from "@orpc/server";
import { count } from "drizzle-orm";
import { z } from "zod";

export const getAll = base
  .use(authMiddleware)
  .input(
    z.object({
      search: z.string().optional(),
      page: z.number().min(1).optional().default(1),
      showUnpublished: z.boolean().optional().default(false),
      sortBy: z
        .enum(["publishedAt", "title"])
        .optional()
        .default("publishedAt"),
    })
  )
  .output(
    z.object({
      articles: articleSelectSchema
        .pick({
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          published: true,
          publishedAt: true,
          updatedAt: true,
        })
        .extend({
          tags: tagSelectSchema
            .pick({
              id: true,
              name: true,
              slug: true,
            })
            .array(),
        })
        .array(),
      pagination: z.object({
        page: z.number(),
        totalPages: z.number(),
        totalItems: z.number(),
      }),
    })
  )
  .handler(async ({ input, context }) => {
    const { search, page, showUnpublished, sortBy } = input;

    if (showUnpublished) {
      if (!context.user) {
        throw new ORPCError("UNAUTHORIZED");
      }
      const hasPermission = await auth.api.userHasPermission({
        body: {
          userId: context.user.id,
          permission: { article: ["readUnpublished"] },
        },
      });
      if (!hasPermission) {
        throw new ORPCError("FORBIDDEN");
      }
    }

    const articles = await db.query.article.findMany({
      where: {
        OR: search
          ? [
              {
                title: { like: `%${search}%` },
              },
              {
                excerpt: { like: `%${search}%` },
              },
              {
                content: { like: `%${search}%` },
              },
            ]
          : undefined,
        published: showUnpublished ? undefined : true,
      },
      orderBy:
        sortBy === "publishedAt" ? { publishedAt: "desc" } : { title: "asc" },
      limit: 20,
      offset: (page - 1) * 20,
      with: {
        tags: {
          columns: { id: true, name: true, slug: true },
        },
      },
      columns: {
        id: true,
        title: true,
        publishedAt: true,
        published: true,
        excerpt: true,
        slug: true,
        updatedAt: true,
      },
    });

    const articleCount = await db.query.article.findFirst({
      where: {
        OR: search
          ? [
              {
                title: { like: `%${search}%` },
              },
              {
                excerpt: { like: `%${search}%` },
              },
              {
                content: { like: `%${search}%` },
              },
            ]
          : undefined,
        published: showUnpublished ? undefined : true,
      },
      columns: {},
      extras: { count: count() },
    });

    if (!articleCount) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return {
      articles,
      pagination: {
        page,
        totalPages: Math.ceil(articleCount.count / 20),
        totalItems: articleCount.count,
      },
    };
  });
