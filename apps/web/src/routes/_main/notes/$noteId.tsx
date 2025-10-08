import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { WithState } from "@/components/fallback/with-state";
import { $getSingleNote, singleNoteQueryOptions } from "@/server/note";

export const Route = createFileRoute("/_main/notes/$noteId")({
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
