import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { Header } from "@/client/components/header";
import { Spinner } from "@/client/components/ui/spinner";
import { authClient } from "@/client/lib/auth";

export const Route = createFileRoute("/admin")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex grow items-center justify-center">
        <Spinner className="size-12 text-primary" />
      </div>
    );
  }

  if (!data?.user) {
    throw notFound();
  }

  if (data.user.role !== "admin") {
    throw notFound();
  }

  return (
    <>
      <Header>{""}</Header>
      <Outlet />
    </>
  );
}
