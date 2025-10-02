import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { queryKeys } from "@/lib/query";
import { $delSessionToken } from "@/lib/server-utils";
import { userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(userQueryOptions);

      if (!user) {
        await $delSessionToken();
        throw redirect({
          to: "/auth/sign-in",
        });
      }

      return { user };
    } catch (error) {
      console.log("Error fetching user, redirecting to sign-in:", error);

      await $delSessionToken();
      throw redirect({
        to: "/auth/sign-in",
      });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.invalidateQueries({ queryKey: [queryKeys.user] });

    return {
      user: context.user,
    };
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
