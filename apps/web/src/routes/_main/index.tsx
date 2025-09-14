import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  return <main className="container"></main>;
}
