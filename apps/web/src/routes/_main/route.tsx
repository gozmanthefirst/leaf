import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { $delSessionToken } from "@/lib/server-utils";
import { folderQueryOptions } from "@/server/folder";
import { userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ context }) => {
    console.log("[_main beforeLoad] Starting user check");
    const start = Date.now();

    const user = await context.queryClient.ensureQueryData(userQueryOptions);

    console.log(
      "[_main beforeLoad] User check completed in:",
      Date.now() - start,
      "ms",
    );

    if (!user) {
      await $delSessionToken();
      throw redirect({ to: "/auth/sign-in" });
    }

    return { user };
  },
  loader: async ({ context }) => {
    console.log("[_main loader] Starting");
    const loaderStart = Date.now();

    const user = await context.queryClient.fetchQuery(userQueryOptions);

    if (!user) {
      await $delSessionToken();
      throw redirect({ to: "/auth/sign-in" });
    }

    console.log("[_main loader] Prefetching folder tree");
    const folderStart = Date.now();
    await context.queryClient.prefetchQuery(folderQueryOptions);
    console.log(
      "[_main loader] Folder tree prefetched in:",
      Date.now() - folderStart,
      "ms",
    );

    console.log(
      "[_main loader] Total loader time:",
      Date.now() - loaderStart,
      "ms",
    );
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
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
