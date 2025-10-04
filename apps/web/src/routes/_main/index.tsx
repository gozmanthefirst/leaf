import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { TbDotsVertical, TbFile } from "react-icons/tb";

import { WithState } from "@/components/fallback/with-state";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { $getFolder, folderQueryOptions } from "@/server/folder";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  const mainRoute = getRouteApi("/_main");
  const { user } = mainRoute.useLoaderData();
  const getFolder = useServerFn($getFolder);

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });

  return (
    <main className="absolute inset-0 flex h-full flex-col">
      {/* Page Header */}
      <header className="sticky top-0 isolate z-10 flex h-10 w-full items-center border-muted/80 px-3 lg:px-6">
        <SidebarTrigger className="lg:hidden" />
        <Button className="ml-auto size-7" size={"icon"} variant={"ghost"}>
          <TbDotsVertical />
        </Button>
      </header>

      {/* Page Content */}
      <div className="flex flex-1 overflow-auto">
        {/* Note */}
        <div className="container flex flex-1">
          <WithState state={folderQuery}>
            {(rf) => {
              if (!rf) return null;

              if (rf.folders.length === 0 && rf.notes.length === 0) {
                return (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <TbFile />
                      </EmptyMedia>
                      <EmptyTitle>No Notes Yet</EmptyTitle>
                      <EmptyDescription>
                        You have no notes or folders. Create one to get started.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button size={"default"}>Create your first note</Button>
                    </EmptyContent>
                  </Empty>
                );
              }

              return <p>This is a note</p>;
            }}
          </WithState>
        </div>
      </div>
    </main>
  );
}
