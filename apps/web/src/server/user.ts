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
    console.log("context session token:", context.session.token);

    const response = await axiosClient.get<ApiSuccessResponse<User>>(
      "/user/me",
      {
        headers: {
          Authorization: `Bearer ${context.session.token}`,
          // Authorization: `Bearer E0vnkL1NSrsgea2wwNmGdI1Ei7pCVsTd.xw8cwp5j3nRhwhsEhkeFP2LGkTm5cKY3xSEY6uJ9uJM%3D`,
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
