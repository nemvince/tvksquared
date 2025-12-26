import {
  type AnySQLiteColumn,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { user } from "@/server/db/schema/auth";

export const article = sqliteTable(
  "article",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").unique().notNull(),
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

export const file = sqliteTable("file", {
  id: text("id").primaryKey(),
  mimeType: text("mime_type").notNull(),
  name: text("name").notNull(),
  extension: text("extension"),
  size: integer("size").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" }).notNull(),
});

export const articleFile = sqliteTable(
  "article_file",
  {
    articleId: text("article_id")
      .notNull()
      .references(() => article.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("articleFile_articleId_idx").on(table.articleId),
    index("articleFile_fileId_idx").on(table.fileId),
    index("articleFile_unique_idx").on(table.articleId, table.fileId),
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

export const blogSchema = {
  article,
  file,
  articleFile,
  tag,
  articleTag,
  comment,
};

export const articleSelectSchema = createSelectSchema(article);
export const articleInsertSchema = createInsertSchema(article);
export const articleUpdateSchema = createUpdateSchema(article);

export const tagSelectSchema = createSelectSchema(tag);
export const tagInsertSchema = createInsertSchema(tag);
export const tagUpdateSchema = createUpdateSchema(tag);

export const commentSelectSchema = createSelectSchema(comment);
export const commentInsertSchema = createInsertSchema(comment);
export const commentUpdateSchema = createUpdateSchema(comment);
