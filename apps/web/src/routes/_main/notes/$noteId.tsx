import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { WithState } from "@/components/fallback/with-state";
import { getMostRecentlyUpdatedNote } from "@/lib/utils";
import { folderQueryOptions } from "@/server/folder";
import { $getSingleNote, singleNoteQueryOptions } from "@/server/note";

export const Route = createFileRoute("/_main/notes/$noteId")({
  beforeLoad: async ({ context, params }) => {
    const note = await context.queryClient.ensureQueryData(
      singleNoteQueryOptions(params.noteId),
    );
    const rootFolder =
      await context.queryClient.ensureQueryData(folderQueryOptions);

    if (!note) {
      if (rootFolder) {
        const mostRecentNote = getMostRecentlyUpdatedNote(rootFolder);

        if (mostRecentNote) {
          throw redirect({
            to: "/notes/$noteId",
            params: { noteId: mostRecentNote.id },
          });
        } else {
          throw redirect({ to: "/" });
        }
      } else {
        throw redirect({ to: "/" });
      }
    }
  },
  loader: async ({ params, context }) => {
    await context.queryClient.prefetchQuery(
      singleNoteQueryOptions(params.noteId),
    );

    return { noteId: params.noteId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { noteId } = Route.useLoaderData();
  const getSingleNote = useServerFn($getSingleNote);

  const singleNoteQuery = useQuery({
    ...singleNoteQueryOptions(noteId),
    queryFn: () => getSingleNote({ data: noteId }),
  });

  return (
    <div className="flex flex-1 overflow-auto pt-4">
      <div className="container flex flex-1">
        <WithState state={singleNoteQuery}>
          {(note) => {
            if (!note) return null;

            return (
              <div className="font-semibold text-2xl md:text-3xl">
                {note.title}
              </div>
            );
          }}
        </WithState>
      </div>
    </div>
  );
}
