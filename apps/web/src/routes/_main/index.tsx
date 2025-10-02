import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="container flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <p className="text-center font-bold font-roboto text-4xl">Hello!</p>
      <Button asChild size={"sm"}>
        <Link to="/auth/sign-in">Sign In</Link>
      </Button>
    </main>
  );
}
