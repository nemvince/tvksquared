import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CommentMarkdown, Markdown } from "@/client/components/markdown";
import { H1, H2 } from "@/client/components/typography";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/client/components/ui/avatar";
import { Badge } from "@/client/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/client/components/ui/card";
import { api, rawApi } from "@/client/lib/api";

export const Route = createFileRoute("/blog/$slug")({
  component: RouteComponent,
  loader: async ({ params }) => {
    try {
      const blogArticle = await rawApi.articles.getOne({
        slug: params.slug,
      });

      return {
        blogArticle,
      };
    } catch (error) {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") {
        notFound({ throw: true });
      }
      throw error;
    }
  },
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const blogQuery = useQuery(
    api.articles.getOne.queryOptions({
      input: { slug },
      retry: (failureCount, error) => {
        if (error instanceof ORPCError && error.code === "NOT_FOUND") {
          return false;
        }
        return failureCount < 3;
      },
    })
  );

  if (blogQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (
    blogQuery.isError &&
    blogQuery.error instanceof ORPCError &&
    blogQuery.error.code === "NOT_FOUND"
  ) {
    notFound({ throw: true });
  }

  if (!blogQuery.data) {
    return <div>Error loading blog article.</div>;
  }

  const { data: article } = blogQuery;

  return (
    <>
      <title>tvk² - {article.title}</title>
      <article className="prose prose-invert mx-auto my-8 max-w-3xl px-4">
        <H1>{article.title}</H1>

        {/* Author Section */}
        {article.author && (
          <div className="not-prose my-4 flex items-center gap-3">
            {article.author.image && (
              <Avatar>
                <AvatarImage src={article.author.image} />
                <AvatarFallback>
                  {article.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="font-medium text-sm">{article.author.name}</div>
              <div className="text-muted-foreground text-xs">
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                  : new Date(article.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Tags Section */}
        {article.tags && article.tags.length > 0 && (
          <div className="not-prose mb-6 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                className="no-underline"
                key={tag.id}
                search={{ tag: tag.slug }}
                to="/blog"
              >
                <Badge variant="secondary">{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        <Markdown>{article.content}</Markdown>

        {/* Comments Section */}
        {article.comments && article.comments.length > 0 && (
          <div className="not-prose mt-12 pt-8">
            <H2>Comments</H2>
            <div className="space-y-6">
              {article.comments.map((comment) => (
                <Card key={comment.id} variant="ghost">
                  <CardHeader className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={comment.author?.image ?? ""} />
                      <AvatarFallback>
                        {comment.author?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {comment.author?.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(comment.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="prose text-sm">
                    {comment.deleted ? (
                      <em className="text-muted-foreground">
                        [Comment deleted]
                      </em>
                    ) : (
                      <CommentMarkdown>{comment.content}</CommentMarkdown>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
