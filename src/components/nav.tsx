"use client";

import { Link } from "@tanstack/react-router";
import type * as React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export const Nav = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex-wrap">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Home</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 md:w-100 lg:w-125 lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink
                  render={
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-linear-to-b from-primary/20 to-card p-4 no-underline outline-hidden transition-all duration-200 focus:shadow-md md:p-6"
                      href="/"
                    >
                      <div className="mb-2 font-medium text-lg sm:mt-4">
                        tvk squared
                      </div>
                      <p className="text-muted-foreground text-sm leading-tight">
                        A site that tries to be useful.
                      </p>
                    </a>
                  }
                />
              </li>
              <ListItem href="/about" title="About me">
                Learn more about the creator of this site.
              </ListItem>
              <ListItem href="/cv" title="Curriculum Vitae">
                My professional experience and skills.
              </ListItem>
              <ListItem href="/contact" title="Contact">
                Get in touch with me.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            render={<Link to="/utils">Utils</Link>}
          />
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink
        render={
          <Link to={href}>
            <div className="font-medium text-sm leading-none">{title}</div>
            <p className="line-clamp-2 text-muted-foreground text-sm leading-snug">
              {children}
            </p>
          </Link>
        }
      />
    </li>
  );
}
