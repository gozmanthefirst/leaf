import type { Note } from "@repo/db";
import type { DecryptedNote } from "@repo/db/validators/note-validators";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { axiosClient } from "@/lib/axios";
import { queryKeys } from "@/lib/query";
import type { ApiSuccessResponse } from "@/lib/types";
import { sessionMiddleware } from "@/middleware/auth-middleware";
import { $getFolder } from "@/server/folder";

//* GET NOTES
// get notes server fn
export const $getNotes = createServerFn()
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    try {
      const response = await axiosClient.get<ApiSuccessResponse<Note[]>>(
        `/notes`,
        {
          headers: {
            Authorization: `Bearer ${context.session.token}`,
          },
        },
      );

      return response.data.data;
    } catch (_error) {
      return null;
    }
  });
// get notes query options
export const notesQueryOptions = queryOptions({
  queryKey: queryKeys.notes(),
  queryFn: $getNotes,
});

//* GET SINGLE NOTE
// get single note server fn
export const $getNote = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(z.string().min(1))
  .handler(async ({ context, data: noteId }) => {
    try {
      const response = await axiosClient.get<ApiSuccessResponse<DecryptedNote>>(
        `/notes/${noteId}`,
        {
          headers: {
            Authorization: `Bearer ${context.session.token}`,
          },
        },
      );

      return response.data.data;
    } catch (_error) {
      return null;
    }
  });
// get single note query options
export const singleNoteQueryOptions = queryOptions({
  queryKey: queryKeys.note(""),
  queryFn: () => $getNote({ data: "" }),
});

//* CREATE NOTE
// create note server fn
export const $createNote = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      title: z.string().min(1),
      folderId: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const rootFolder = await $getFolder();

    const payload = {
      folderId: data.folderId ?? rootFolder?.id,
      title: data.title,
    };

    const response = await axiosClient.post<ApiSuccessResponse<Note>>(
      "/notes",
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });

//* MAKE NOTE COPY
// make note copy server fn
export const $makeNoteCopy = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      noteId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const response = await axiosClient.get<ApiSuccessResponse<Note>>(
      `/notes/${data.noteId}/copy`,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });

//* RENAME NOTE
// rename note server fn
export const $renameNote = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      title: z.string().min(1),
      noteId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const payload = {
      title: data.title,
    };

    await axiosClient.put<ApiSuccessResponse<Note>>(
      `/notes/${data.noteId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );
  });

//* DELETE NOTE
// delete note server fn
export const $deleteNote = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      noteId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    await axiosClient.delete<ApiSuccessResponse<Note>>(
      `/notes/${data.noteId}`,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );
  });
