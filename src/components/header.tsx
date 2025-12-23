import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme/toggle";

export const Header = () => {
	return (
		<header className="flex items-center justify-between gap-4 border-b p-6">
			<h2 className="font-bold text-lg tracking-tight">
				<Link to="/">
					<span className="bg-primary text-primary-foreground">tvk</span>
					<sup className="text-lg text-primary">2</sup>
				</Link>
			</h2>

			<ThemeToggle />
		</header>
	);
};
