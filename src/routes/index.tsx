import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<div className="grow">
			<h1 className="font-bold text-4xl tracking-tight">test</h1>
			<p>hello world</p>
			<Button>A button</Button>
			<Link className="mt-4 inline-block underline" to="/">
				home
			</Link>
		</div>
	);
}
