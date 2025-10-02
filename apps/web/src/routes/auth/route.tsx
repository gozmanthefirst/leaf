import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { $delSessionToken } from "@/lib/server-utils";
import { $getUser } from "@/server/user";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    try {
      const user = await $getUser();

      if (user) {
        throw redirect({
          to: "/",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      await $delSessionToken();
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="container w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
