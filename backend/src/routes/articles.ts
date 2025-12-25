import { db } from "@backend/db";
import {
  article,
  createArticleSchema,
  selectArticleSchema,
} from "@backend/db/schema/blog";
import { auth } from "@backend/lib/auth";
import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import { Elysia, t } from "elysia";

const getSortByClause = (sortBy: string, order: "asc" | "desc") => {
  switch (sortBy) {
    case "title":
      return order === "asc" ? asc(article.title) : desc(article.title);
    case "publishedAt":
      return order === "asc"
        ? asc(article.publishedAt)
        : desc(article.publishedAt);
    default:
      return article.publishedAt;
  }
};

export const articles = new Elysia({ prefix: "articles" })
  .get(
    "/",
    async ({ query, request }) => {
      const PAGE_SIZE = 25;

      if (query.showUnpublished) {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
          throw new Error("Unauthenticated");
        }
        const canReadUnpublished = await auth.api.userHasPermission({
          body: {
            permission: { article: ["readUnpublished"] },
            userId: session.user.id,
          },
        });
        if (!canReadUnpublished) {
          throw new Error("Unauthorized to view unpublished articles");
        }
      }

      const whereClause = and(
        query.showUnpublished ? undefined : eq(article.published, true),
        query.search
          ? ilike(article.title, `%${query.search ?? ""}%`)
          : undefined
      );

      const articles = await db
        .select({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          published: article.published,
          publishedAt: article.publishedAt,
        })
        .from(article)
        .where(whereClause)
        .orderBy(getSortByClause(query.sortBy, query.order))
        .limit(PAGE_SIZE)
        .offset((query.page - 1) * PAGE_SIZE);

      const [articleCount] = await db
        .select({
          count: count(),
        })
        .from(article)
        .where(whereClause);

      if (!articleCount) {
        throw new Error("Failed to count articles");
      }

      return {
        articles,
        pagination: {
          page: query.page,
          totalPages: Math.ceil(articleCount.count / PAGE_SIZE),
          totalItems: articleCount.count,
        },
      };
    },
    {
      query: t.Object({
        showUnpublished: t.Boolean({ default: false }),
        search: t.Optional(t.String()),
        page: t.Number({ default: 1 }),
        sortBy: t.UnionEnum(["title", "publishedAt"], {
          default: "publishedAt",
        }),
        order: t.UnionEnum(["asc", "desc"], { default: "desc" }),
      }),
      response: t.Object({
        articles: t.Array(
          t.Pick(
            selectArticleSchema,
            t.Union([
              t.Literal("slug"),
              t.Literal("title"),
              t.Literal("excerpt"),
              t.Literal("published"),
              t.Literal("publishedAt"),
            ])
          )
        ),
        pagination: t.Object({
          page: t.Number(),
          totalPages: t.Number(),
          totalItems: t.Number(),
        }),
      }),
    }
  )
  .post(
    "/",
    async ({ body, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        throw new Error("Unauthorized to create article");
      }
      const canCreate = await auth.api.userHasPermission({
        body: {
          permission: { article: ["create"] },
          userId: session.user.id,
        },
      });
      if (!canCreate) {
        throw new Error("Unauthorized to create article");
      }

      const [result] = await db.insert(article).values(body).returning();

      if (!result) {
        throw new Error("Failed to create article");
      }

      return result;
    },
    {
      body: createArticleSchema,
      response: selectArticleSchema,
    }
  )
  .get(
    "/:slug",
    async ({ params, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });

      const [articleRecord] = await db
        .select()
        .from(article)
        .where(
          and(
            eq(article.slug, params.slug),
            session?.user ? undefined : eq(article.published, true)
          )
        )
        .limit(1);

      if (!articleRecord) {
        throw new Error("Article not found");
      }

      if (!articleRecord.published) {
        if (!session?.user) {
          throw new Error("Unauthenticated");
        }
        const canReadUnpublished = await auth.api.userHasPermission({
          body: {
            permission: { article: ["readUnpublished"] },
            userId: session.user.id,
          },
        });
        if (!canReadUnpublished) {
          throw new Error("Unauthorized to view unpublished article");
        }
      }

      return articleRecord;
    },
    {
      params: t.Object({
        slug: t.String(),
      }),
      response: selectArticleSchema,
    }
  )
  .patch(
    "/:slug",
    async ({ params, body, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        throw new Error("Unauthorized to update article");
      }
      const canUpdate = await auth.api.userHasPermission({
        body: {
          permission: { article: ["update"] },
          userId: session.user.id,
        },
      });
      if (!canUpdate) {
        throw new Error("Unauthorized to update article");
      }

      const [updatedArticle] = await db
        .update(article)
        .set(body)
        .where(eq(article.slug, params.slug))
        .returning();

      if (!updatedArticle) {
        throw new Error("Failed to update article");
      }

      return updatedArticle;
    },
    {
      params: t.Object({
        slug: t.String(),
      }),
      body: createArticleSchema,
      response: selectArticleSchema,
    }
  )
  .delete(
    "/:slug",
    async ({ params, request }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        throw new Error("Unauthorized to delete article");
      }
      const canDelete = await auth.api.userHasPermission({
        body: {
          permission: { article: ["delete"] },
          userId: session.user.id,
        },
      });
      if (!canDelete) {
        throw new Error("Unauthorized to delete article");
      }

      const deletedCount = await db
        .delete(article)
        .where(eq(article.slug, params.slug))
        .returning()
        .then((res) => res.length);

      if (deletedCount === 0) {
        throw new Error("Failed to delete article");
      }

      return { success: true };
    },
    {
      params: t.Object({
        slug: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
      }),
    }
  );
