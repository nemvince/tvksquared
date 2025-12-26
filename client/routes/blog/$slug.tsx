import { ORPCError } from "@orpc/client";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { Markdown } from "@/client/components/markdown";
import { H1 } from "@/client/components/typography";
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

  return (
    <>
      <title>tvk² - {blogQuery.data.title}</title>
      <article className="prose prose-invert mx-auto my-8 max-w-3xl px-4">
        <H1>{blogQuery.data.title}</H1>
        <Markdown components={{}}>{blogQuery.data.content}</Markdown>
      </article>
    </>
  );
}
