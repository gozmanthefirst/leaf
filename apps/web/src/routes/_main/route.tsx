import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { $delSessionToken } from "@/lib/server-utils";
import { userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient
      .fetchQuery(userQueryOptions)
      .catch(() => null);

    if (!user) {
      await $delSessionToken();
      throw redirect({ to: "/auth/sign-in" });
    }

    return { user: user.data };
  },
  loader: async ({ context }) => {
    return {
      user: context.user,
    };
  },
  component: MainLayout,
});

function MainLayout() {
  const { user } = Route.useLoaderData();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <div className="flex-1">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
