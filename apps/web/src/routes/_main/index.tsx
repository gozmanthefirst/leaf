import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { $getUser, userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  const getUser = useServerFn($getUser);

  const getUserQuery = useQuery({
    queryFn: getUser,
    queryKey: userQueryOptions.queryKey,
  });

  return (
    <main
      className="container flex min-h-svh flex-col items-center justify-center gap-8 p-4"
      onClick={() => console.log(getUserQuery.data?.data)}
    >
      <p className="text-center font-bold font-roboto text-4xl">Hello!</p>
      <Button render={<Link to="/auth/sign-in" />} size={"sm"}>
        Sign In
      </Button>
    </main>
  );
}
