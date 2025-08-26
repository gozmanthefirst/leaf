import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import type { AppRouteHandler, ErrorStatusCodes } from "@/lib/types";
import type { UpdateUserRoute } from "@/routes/user/user.routes";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { GetUserRoute } from "./user.routes";

export const getUser: AppRouteHandler<GetUserRoute> = async (c) => {
  try {
    const response = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(response?.user, "User retrieved successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof getUser>,
      );
    }

    throw error;
  }
};

export const updateUser: AppRouteHandler<UpdateUserRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.updateUser({
      body: data,
      headers: c.req.raw.headers,
    });

    return c.json(
      successResponse(response, "User updated successfully"),
      HttpStatusCodes.OK,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof getUser>,
      );
    }

    throw error;
  }
};
