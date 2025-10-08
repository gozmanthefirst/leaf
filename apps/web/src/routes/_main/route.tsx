import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { NotePageHeader } from "@/components/shared/note-page";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { $delSessionToken } from "@/lib/server-utils";
import { folderQueryOptions } from "@/server/folder";
import { userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions);

    if (!user) {
      await $delSessionToken();
      throw redirect({ to: "/auth/sign-in" });
    }

    return { user };
  },
  loader: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(userQueryOptions);

    if (!user) {
      await $delSessionToken();
      throw redirect({ to: "/auth/sign-in" });
    }

    await context.queryClient.prefetchQuery(folderQueryOptions);

    return { user };
  },
  component: MainLayout,
});

function MainLayout() {
  const { user } = Route.useLoaderData();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="overflow-hidden">
        <div className="relative flex-1">
          <main className="absolute inset-0 flex h-full flex-col">
            <NotePageHeader />
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
