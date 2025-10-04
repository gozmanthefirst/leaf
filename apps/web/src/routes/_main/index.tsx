import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  TbAppWindow,
  TbBook,
  TbDotsVertical,
  TbEdit,
  TbFile,
  TbFileArrowRight,
  TbFiles,
  TbStar,
  TbTrash,
} from "react-icons/tb";

import { WithState } from "@/components/fallback/with-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <NotePageHeader />

      {/* Page Content */}
      <div className="flex flex-1 overflow-auto pt-4">
        {/* Note */}
        <div className="container flex flex-1">
          <WithState state={folderQuery}>
            {(rf) => {
              if (!rf) return null;

              if (rf.notes.length === 0) {
                return (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <TbFile />
                      </EmptyMedia>
                      <EmptyTitle>No Notes Yet</EmptyTitle>
                      <EmptyDescription>
                        You do not have any notes yet. Create one to get
                        started.
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

const NotePageHeader = () => {
  const getFolder = useServerFn($getFolder);

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });

  return (
    <header className="sticky top-0 isolate z-10 flex h-10 w-full items-center border-muted/80 px-3 lg:px-6">
      <SidebarTrigger className="lg:hidden" />

      <WithState state={folderQuery}>
        {(rf) => {
          if (!rf) return null;

          if (rf.notes.length === 0) return null;

          return (
            <div className="ml-auto flex items-center gap-1">
              <Button className="size-7" size={"icon"} variant={"ghost"}>
                <TbBook />
              </Button>
              <NotePageDropdown />
            </div>
          );
        }}
      </WithState>
    </header>
  );
};

const NotePageDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="size-7" size={"icon"} variant={"ghost"}>
          <TbDotsVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={"end"} className="w-56" side={"bottom"}>
        <DropdownMenuItem>
          <TbAppWindow className="text-muted-foreground" />
          <span>Open in new window</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <TbFiles className="text-muted-foreground" />
          <span>Make a copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbFileArrowRight className="text-muted-foreground" />
          <span>Move note to...</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbStar className="text-muted-foreground" />
          <span>Favorite note</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <TbEdit className="text-muted-foreground" />
          <span>Rename note</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <TbTrash className="text-muted-foreground" />
          <span>Delete note</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
