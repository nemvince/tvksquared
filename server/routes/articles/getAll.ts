import { ORPCError } from "@orpc/server";
import { count } from "drizzle-orm";
import { z } from "zod";
import { base } from "@/server/context";
import { db } from "@/server/db";
import { articleSelectSchema, tagSelectSchema } from "@/server/db/schema/blog";
import { auth } from "@/server/lib/auth";
import { authMiddleware } from "@/server/lib/auth/middleware";

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
      tagSlug: z.string().optional(),
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
    const { search, page, showUnpublished, sortBy, tagSlug } = input;

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

    const where = {
      published: showUnpublished ? undefined : true,
      AND: [
        ...(search
          ? [
              {
                OR: [
                  {
                    title: { like: `%${search}%` },
                  },
                  {
                    excerpt: { like: `%${search}%` },
                  },
                  {
                    content: { like: `%${search}%` },
                  },
                ],
              },
            ]
          : []),
        ...(tagSlug
          ? [
              {
                tags: {
                  slug: {
                    eq: tagSlug,
                  },
                },
              },
            ]
          : []),
      ],
    };

    const articles = await db.query.article.findMany({
      where,
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
      where,
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
