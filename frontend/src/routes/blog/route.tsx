import { Header } from "@frontend/components/header";
import { Nav } from "@frontend/components/nav";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/blog")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header>
        <Nav />
      </Header>
      <Outlet />
    </>
  );
}
