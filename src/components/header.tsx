import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme/toggle";

export const Header = ({
  children = <Nav />,
  showLogo = true,
}: {
  children?: ReactNode;
  showLogo?: boolean;
}) => {
  return (
    <header className="flex items-center justify-between gap-4 border-b p-4">
      <div className="flex gap-4">
        {showLogo && (
          <Link to="/">
            <Logo />
          </Link>
        )}

        {children}
      </div>

      <ThemeToggle />
    </header>
  );
};
