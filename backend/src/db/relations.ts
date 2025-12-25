import { schema } from "@backend/db/schema";
import { defineRelations } from "drizzle-orm";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  article: {
    author: r.one.user({
      from: r.article.authorId,
      to: r.user.id,
    }),
    tags: r.many.tag({
      from: r.article.id.through(r.articleTag.articleId),
      to: r.tag.id.through(r.articleTag.tagId),
    }),
    comments: r.many.comment({
      from: r.article.id,
      to: r.comment.articleId,
    }),
  },
  articleTag: {
    article: r.one.article({
      from: r.articleTag.articleId,
      to: r.article.id,
    }),
    tag: r.one.tag({
      from: r.articleTag.tagId,
      to: r.tag.id,
    }),
  },
  tag: {
    articleTags: r.many.articleTag(),
  },
  comment: {
    article: r.one.article({
      from: r.comment.articleId,
      to: r.article.id,
    }),
    author: r.one.user({
      from: r.comment.authorId,
      to: r.user.id,
    }),
    parent: r.one.comment({
      from: r.comment.parentId,
      to: r.comment.id,
    }),
    children: r.many.comment({
      from: r.comment.id,
      to: r.comment.parentId,
    }),
  },
}));
