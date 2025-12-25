import { base } from "@backend/context";
import { db } from "@backend/db";
import { articleSelectSchema } from "@backend/db/schema/blog";
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
      articles: z.array(
        articleSelectSchema.pick({
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          published: true,
          publishedAt: true,
          updatedAt: true,
        }).extend({})
      ),
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
      const hasPermission = await auth.api.userHasPermission(
        { body: { userId: context.user.id, permission: { "article": ["readUnpublished"] } } })
      if (!hasPermission) {
        throw new ORPCError("FORBIDDEN");
      }
    }

    const articles = await db.query.article.findMany({
      where: {
        title: search ? {
          ilike: `%${search}%`,
        } : undefined,
        published: showUnpublished ? undefined : true,
      },
      orderBy: sortBy === "publishedAt" ? { publishedAt: "desc" } : { title: "asc" },
      limit: 20,
      offset: (page - 1) * 20,
      with: {
        tags: true,
      },
      columns: {
        id: true,
        title: true,
        publishedAt: true,
        published: true,
        excerpt: true,
        slug: true,
        updatedAt: true,
      }
    });

    const articleCount = await db.query.article.findFirst({
      columns: {},
      extras: { count: count() }
    })

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
