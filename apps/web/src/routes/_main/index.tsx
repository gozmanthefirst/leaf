import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { $getUser, userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  const getUser = useServerFn($getUser);

  const _getUserQuery = useQuery({
    queryFn: getUser,
    queryKey: userQueryOptions.queryKey,
  });

  return <main className="container">Hello!</main>;
}
