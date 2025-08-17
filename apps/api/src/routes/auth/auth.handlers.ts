import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import type { AppRouteHandler, ErrorStatusCodes } from "@/lib/types";
import { errorResponse, successResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";
import type { SignUpUserRoute } from "./auth.routes";

export const signUpUser: AppRouteHandler<SignUpUserRoute> = async (c) => {
  try {
    const data = c.req.valid("json");

    const response = await auth.api.signUpEmail({
      body: data,
    });

    return c.json(
      successResponse(response, "User signed up successfully"),
      HttpStatusCodes.CREATED as 201,
    );
  } catch (error) {
    if (error instanceof APIError) {
      return c.json(
        errorResponse(
          error.body?.code ?? "AUTH_ERROR",
          error.body?.message ?? error.message,
        ),
        error.statusCode as ErrorStatusCodes<typeof signUpUser>,
      );
    }

    throw error;
  }
};
