import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  const mainRoute = getRouteApi("/_main");
  const { user } = mainRoute.useLoaderData();

  return (
    <main className="container flex h-full flex-col gap-2 p-4">
      <header>
        <SidebarTrigger className="-ml-2 lg:hidden" />
      </header>
      <div></div>
      <h1 className="font-semibold text-lg">Welcome, {user.name}!</h1>
    </main>
  );
}
