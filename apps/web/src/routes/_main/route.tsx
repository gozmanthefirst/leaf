import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

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
  },
  component: MainLayout,
});

function MainLayout() {
  return (
    <div className="flex-1">
      <Outlet />
    </div>
  );
}
