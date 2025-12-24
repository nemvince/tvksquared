import { type Icon, KeyboardIcon, TextAaIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { FileRoutesByTo } from "@/route-tree.gen";
import { Separator } from "../ui/separator";

interface UtilsItem {
  title: string;
  slug: string;
  icon: Icon;
}

interface UtilsGroup {
  title: string;
  slug: string;
  icon: Icon;
  items: UtilsItem[];
}

const items: UtilsGroup[] = [
  {
    title: "Text Tools",
    slug: "text",
    icon: TextAaIcon,
    items: [
      {
        title: "Lorem Ipsum Generator",
        slug: "lorem-ipsum-generator",
        icon: KeyboardIcon,
      },
    ],
  },
];

export function UtilsSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="mt-2 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="font-semibold text-lg">Utils</span>
        </div>
        <Separator className="mt-2" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {items.map((group) => (
              <SidebarMenuItem key={group.title}>
                <SidebarMenuButton>
                  <group.icon />
                  {group.title}
                </SidebarMenuButton>
                {group.items?.length ? (
                  <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton
                          isActive={false}
                          render={
                            <Link
                              className="w-full pl-4"
                              to={
                                `${group.slug}/${item.slug}` as keyof FileRoutesByTo
                              }
                            >
                              <item.icon />
                              {item.title}
                            </Link>
                          }
                        />
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
