import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/client/components/header";
import { Nav } from "@/client/components/nav";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/client/components/ui/sidebar";
import { UtilsSidebar } from "@/client/components/utils/sidebar";

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
