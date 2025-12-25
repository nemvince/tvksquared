import { Footer } from "@frontend/components/footer";
import { Header } from "@frontend/components/header";
import { Button } from "@frontend/components/ui/button";
import { api } from "@frontend/lib/api";
import { authClient } from "@frontend/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

const Auth = () => {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (data?.user) {
    return (
      <div>
        <p>Signed in as {data.user.email}</p>
        <Button
          onClick={() => {
            authClient.signOut();
          }}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p>You are not signed in.</p>
      <Button
        onClick={() => {
          authClient.signIn.social({
            provider: "github",
          });
        }}
      >
        Sign In with GitHub
      </Button>
    </div>
  );
};

function App() {
  const query = useQuery(api.articles.getAll.queryOptions({
    input: {},
  }));

  if (query.isLoading) {
    return <div>Loading articles...</div>;
  }

  if (query.error) {
    return <div>Error loading articles: {String(query.error)}</div>;
  }

  return (
    <>
      <Header />
      <div className="grow">
        <h1 className="font-bold text-4xl tracking-tight">test</h1>
        <p>hello world</p>
        {JSON.stringify(query.data)}
        <Auth />
      </div>
      <Footer />
    </>
  );
}
