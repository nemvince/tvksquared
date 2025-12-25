import { Header } from "@frontend/components/header";
import { Nav } from "@frontend/components/nav";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@frontend/components/ui/sidebar";
import { UtilsSidebar } from "@frontend/components/utils/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/utils")({
  component: Layout,
});

function Layout() {
  return (
    <SidebarProvider>
      <UtilsSidebar />
      <div className="flex grow flex-col gap-4">
        <Header showLogo={false}>
          <SidebarTrigger />
          <Nav />
        </Header>
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
