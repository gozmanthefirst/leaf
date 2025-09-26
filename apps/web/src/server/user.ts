import type { User } from "@repo/db";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { axiosClient } from "@/lib/axios";
import { queryKeys } from "@/lib/query";
import type { ApiSuccessResponse } from "@/lib/types";
import { sessionMiddleware } from "@/middleware/auth-middleware";

//* GET USER
// get user server fn
export const $getUser = createServerFn({
  method: "GET",
})
  .middleware([sessionMiddleware])
  .handler(async ({ context }) => {
    const response = await axiosClient.get<ApiSuccessResponse<User>>(
      "/user/me",
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
        },
      },
    );

    return response.data;
  });
// get user query options
export const userQueryOptions = queryOptions({
  queryKey: [queryKeys.user],
  queryFn: $getUser,
});
