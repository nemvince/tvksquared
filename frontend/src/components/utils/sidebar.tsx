import { Logo } from "@frontend/components/logo";
import { Button } from "@frontend/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@frontend/components/ui/command";
import { Separator } from "@frontend/components/ui/separator";
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
} from "@frontend/components/ui/sidebar";
import type { FileRoutesByTo } from "@frontend/route-tree.gen";
import {
  type Icon,
  KeyboardIcon,
  MagnifyingGlassIcon,
  TextAaIcon,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { type ComponentProps, useState } from "react";

type UtilsItem = {
  title: string;
  slug: string;
  icon: Icon;
};

type UtilsGroup = {
  title: string;
  slug: string;
  icon: Icon;
  items: UtilsItem[];
};

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

const SearchBox = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Button
        className="w-full"
        onClick={() => setOpen(true)}
        variant="outline"
      >
        <MagnifyingGlassIcon className="opacity-50" />
        Search Utilities
      </Button>
      <CommandDialog onOpenChange={setOpen} open={open}>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {items.map((group) => (
              <CommandGroup heading={group.title} key={group.title}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.title}
                    onSelect={() => {
                      navigate({ to: `/utils/${group.slug}/${item.slug}` });
                      setOpen(false);
                    }}
                  >
                    <item.icon />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export function UtilsSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="mt-5 flex items-center justify-center p-0">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="font-semibold text-lg">Utils</span>
        </div>
        <Separator className="mt-2" />
        <div className="w-full px-3">
          <SearchBox />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {items.map((group) => (
              <SidebarMenuItem key={group.title}>
                <SidebarMenuButton disabled={true}>
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
