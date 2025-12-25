import { Logo } from "@frontend/components/logo";
import { Nav } from "@frontend/components/nav";
import { ThemeToggle } from "@frontend/components/theme/toggle";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ButtonGroup } from "./ui/button-group";

export const Header = ({
  children = <Nav />,
  additionalButtons = null,
  showLogo = true,
}: {
  children?: ReactNode;
  additionalButtons?: ReactNode;
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

      <ButtonGroup>
        {additionalButtons}
        <ThemeToggle />
      </ButtonGroup>
    </header>
  );
};
