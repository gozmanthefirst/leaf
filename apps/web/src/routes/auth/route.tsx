import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="container w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
