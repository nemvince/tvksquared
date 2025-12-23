import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme/toggle";

export const Header = () => {
	return (
		<header className="flex items-center justify-between gap-4 border-b p-4">
			<Link to="/">
				<Logo />
			</Link>

			<ThemeToggle />
		</header>
	);
};
