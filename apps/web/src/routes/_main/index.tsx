import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { TbFile } from "react-icons/tb";

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
import { useNoteMutations } from "@/hooks/use-note-mutations";
import { countFolderStats, getMostRecentlyUpdatedNote } from "@/lib/utils";
import { $getFolder, folderQueryOptions } from "@/server/folder";

export const Route = createFileRoute("/_main/")({
  beforeLoad: async ({ context }) => {
    const rootFolder =
      await context.queryClient.ensureQueryData(folderQueryOptions);

    if (rootFolder) {
      const mostRecentNote = getMostRecentlyUpdatedNote(rootFolder);

      if (mostRecentNote) {
        throw redirect({
          to: "/notes/$noteId",
          params: { noteId: mostRecentNote.id },
        });
      }
    }
  },
  component: HomePage,
});

function HomePage() {
  const mainRoute = getRouteApi("/_main");
  const { queryClient, user } = mainRoute.useRouteContext();
  const getFolder = useServerFn($getFolder);

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });

  const rootFolder = folderQuery.data;

  const { createNoteOptimistic, createNotePending } = useNoteMutations({
    queryClient,
    rootFolder,
    user,
    setActiveNoteParentId: () => {},
  });

  const handleCreateNote = () => {
    if (rootFolder) {
      createNoteOptimistic("Untitled", rootFolder.id);
    }
  };

  return (
    <main className="absolute inset-0 flex h-full flex-col">
      <div className="flex flex-1 overflow-auto pt-4">
        <div className="container flex flex-1">
          <WithState state={folderQuery}>
            {(rf) => {
              if (!rf) return null;
              const stats = countFolderStats(rf);

              if (stats.notes === 0) {
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
                      <Button
                        disabled={createNotePending}
                        onClick={handleCreateNote}
                        size={"default"}
                      >
                        Create your first note
                      </Button>
                    </EmptyContent>
                  </Empty>
                );
              }

              return null;
            }}
          </WithState>
        </div>
      </div>
    </main>
  );
}
