import { user } from "@backend/db/schema/auth";
import { relations } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const article = sqliteTable(
  "article",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    published: integer("published", { mode: "boolean" })
      .default(false)
      .notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("article_authorId_idx").on(table.authorId),
    index("article_slug_idx").on(table.slug),
    index("article_published_idx").on(table.published),
  ]
);

export const tag = sqliteTable(
  "tag",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("tag_slug_idx").on(table.slug)]
);

export const articleTag = sqliteTable(
  "article_tag",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => article.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("articleTag_articleId_idx").on(table.articleId),
    index("articleTag_tagId_idx").on(table.tagId),
    index("articleTag_unique_idx").on(table.articleId, table.tagId),
  ]
);

export const comment = sqliteTable(
  "comment",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => article.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): AnySQLiteColumn => comment.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    deleted: integer("deleted", { mode: "boolean" }).default(false).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("comment_articleId_idx").on(table.articleId),
    index("comment_authorId_idx").on(table.authorId),
    index("comment_parentId_idx").on(table.parentId),
  ]
);

export const articleRelations = relations(article, ({ one, many }) => ({
  author: one(user, {
    fields: [article.authorId],
    references: [user.id],
  }),
  tags: many(articleTag),
  comments: many(comment),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  articleTags: many(articleTag),
}));

export const articleTagRelations = relations(articleTag, ({ one }) => ({
  article: one(article, {
    fields: [articleTag.articleId],
    references: [article.id],
  }),
  tag: one(tag, {
    fields: [articleTag.tagId],
    references: [tag.id],
  }),
}));

export const commentRelations = relations(comment, ({ one, many }) => ({
  article: one(article, {
    fields: [comment.articleId],
    references: [article.id],
  }),
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "comment_parent",
  }),
  children: many(comment, { relationName: "comment_parent" }),
}));

export const blogSchema = {
  article,
  tag,
  articleTag,
  comment,
};

export const blogRelations = {
  articleRelations,
  tagRelations,
  articleTagRelations,
  commentRelations,
};

export const createArticleSchema = createInsertSchema(article);
export const selectArticleSchema = createSelectSchema(article);

export const createTagSchema = createInsertSchema(tag);
export const selectTagSchema = createSelectSchema(tag);

export const createArticleTagSchema = createInsertSchema(articleTag);
export const selectArticleTagSchema = createSelectSchema(articleTag);

export const createCommentSchema = createInsertSchema(comment);
export const selectCommentSchema = createSelectSchema(comment);
