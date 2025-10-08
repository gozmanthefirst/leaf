import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
import { countFolderStats } from "@/lib/utils";
import { $getFolder, folderQueryOptions } from "@/server/folder";

export const Route = createFileRoute("/_main/")({
  component: HomePage,
});

function HomePage() {
  const getFolder = useServerFn($getFolder);

  const folderQuery = useQuery({
    ...folderQueryOptions,
    queryFn: () => getFolder(),
  });

  return (
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
                      You do not have any notes yet. Create one to get started.
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
  );
}
