import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/client/components/footer";
import { Header } from "@/client/components/header";
import { Button } from "@/client/components/ui/button";
import { authClient } from "@/client/lib/auth";

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
  return (
    <>
      <title>tvk² - home</title>
      <Header />
      <div className="grow">
        <h1 className="font-bold text-4xl tracking-tight">test</h1>
        <p>hello world</p>
        <Auth />
      </div>
      <Footer />
    </>
  );
}
