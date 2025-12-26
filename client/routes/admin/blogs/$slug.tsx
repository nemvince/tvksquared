import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/blogs/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <div>Hello "/admin/blogs/{slug}"!</div>;
}
