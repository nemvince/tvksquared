import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "@/client/components/footer";
import { Header } from "@/client/components/header";
import { Nav } from "@/client/components/nav";

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
      <Footer />
    </>
  );
}
