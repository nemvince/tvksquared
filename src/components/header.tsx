import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
import { ThemeToggle } from "@/components/theme/toggle";

export const Header = () => {
  return (
    <header className="flex items-center justify-between gap-4 border-b p-4">
      <div className="flex gap-4">
        <Link to="/">
          <Logo />
        </Link>

        <Nav />
      </div>

      <ThemeToggle />
    </header>
  );
};
