import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/")({
  beforeLoad: () => {
    throw redirect({
      to: "/auth/sign-in",
    });
  },
  component: HomePage,
});

function HomePage() {
  return <main className="container"></main>;
}
