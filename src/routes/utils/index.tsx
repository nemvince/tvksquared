import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/utils/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/utils/"!</div>;
}
