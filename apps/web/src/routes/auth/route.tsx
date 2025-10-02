import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { $getUser } from "@/server/user";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const user = await $getUser();

    if (user) {
      throw redirect({
        to: "/",
      });
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
