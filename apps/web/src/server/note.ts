import type { Note } from "@repo/db/schemas/note.schema";
import type { DecryptedNote } from "@repo/db/validators/note.validator";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import pako from "pako";
import z from "zod";

import { axiosClient } from "@/lib/axios";
import { queryKeys } from "@/lib/query";
import type { ApiSuccessResponse } from "@/lib/types";
import { sessionMiddleware } from "@/middleware/auth-middleware";
import { $getFolder } from "@/server/folder";

// Helper to get byte size of a string
const getByteSize = (str: string): number => {
  return new TextEncoder().encode(str).length;
};

// Helper to convert Uint8Array to base64 without stack overflow
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  // Use Buffer in Node.js environment (server-side)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  // Fallback for browser (shouldn't happen in server fn, but just in case)
  // Process in chunks to avoid stack overflow
  const CHUNK_SIZE = 0x8000; // 32KB chunks
  let result = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    result += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(result);
};

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
  // Notes list should be fresh
  staleTime: 30 * 1000, // 30 seconds
});

//* GET SINGLE NOTE
// get single note server fn
export const $getSingleNote = createServerFn()
  .middleware([sessionMiddleware])
  .inputValidator(z.string().min(1))
  .handler(async ({ context, data: noteId }) => {
    if (noteId.startsWith("temp-note-")) {
      return null;
    }

    try {
      const response = await axiosClient.get<ApiSuccessResponse<DecryptedNote>>(
        `/notes/${noteId}`,
        {
          headers: {
            Authorization: `Bearer ${context.session.token}`,
          },
          timeout: 10000,
        },
      );

      const note = response.data.data;

      return note;
    } catch {
      return null;
    }
  });
// get single note query options
export const singleNoteQueryOptions = (noteId: string) =>
  queryOptions({
    queryKey: queryKeys.note(noteId),
    queryFn: () => $getSingleNote({ data: noteId }),
    // Notes change frequently, use shorter stale time
    staleTime: 60 * 1000, // 1 minute
    // Keep note data in cache longer for quick navigation
    gcTime: 15 * 60 * 1000, // 15 minutes
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
export const $renameNote = createServerFn({
  method: "POST",
})
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

    const response = await axiosClient.put<ApiSuccessResponse<Note>>(
      `/notes/${data.noteId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });

//* UPDATE NOTE CONTENT
// update note content server fn
export const $updateNoteContent = createServerFn({
  method: "POST",
})
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      title: z.string().min(1),
      noteId: z.string().min(1),
      content: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const payload: {
      title: string;
      content?: string;
      _compressed?: boolean;
    } = {
      title: data.title,
    };

    // Compress content if it's large (> 10KB in bytes)
    const contentSize = getByteSize(data.content);
    if (data.content && contentSize > 10240) {
      try {
        // Compress using gzip
        const compressed = pako.gzip(data.content);

        // Convert to base64 safely
        const base64 = uint8ArrayToBase64(compressed);

        payload.content = base64;
        payload._compressed = true;

        console.log(
          `Compressed ${contentSize} bytes -> ${base64.length} base64 chars (${Math.round((1 - (base64.length * 0.75) / contentSize) * 100)}% reduction)`,
        );
      } catch (error) {
        console.error("Compression failed, sending uncompressed:", error);
        payload.content = data.content;
      }
    } else {
      payload.content = data.content;
    }

    const response = await axiosClient.put<ApiSuccessResponse<Note>>(
      `/notes/${data.noteId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });

//* MOVE NOTE
// move note server fn
export const $moveNote = createServerFn({
  method: "POST",
})
  .middleware([sessionMiddleware])
  .inputValidator(
    z.object({
      noteId: z.string().min(1),
      folderId: z.string().min(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const payload = {
      folderId: data.folderId,
    };

    const response = await axiosClient.patch<ApiSuccessResponse<Note>>(
      `/notes/${data.noteId}/move`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
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
