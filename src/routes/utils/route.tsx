import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { UtilsSidebar } from "@/components/utils/sidebar";

export const Route = createFileRoute("/utils")({
  component: Layout,
});

function Layout() {
  return (
    <SidebarProvider>
      <UtilsSidebar />
      <div className="flex grow flex-col gap-4">
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
