import type { DecryptedNote } from "@repo/db/validators/note-validators";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

import { axiosClient } from "@/lib/axios";
import { queryKeys } from "@/lib/query";
import type { ApiSuccessResponse } from "@/lib/types";
import { sessionMiddleware } from "@/middleware/auth-middleware";

//* GET SINGLE NOTE
// get single note server fn
export const $getNote = createServerFn({
  method: "GET",
})
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
export const noteQueryOptions = queryOptions({
  queryKey: [queryKeys.note],
  queryFn: () => $getNote({ data: "" }),
});
