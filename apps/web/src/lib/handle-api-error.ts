import { AxiosError } from "axios";

import type { ApiErrorResponse } from "./types";

type ErrorHandlerOptions = {
  defaultMessage?: string;
  errorMapping?: Record<string, Record<string, string> | string>;
};

type HandlerReturnType = {
  status: "error";
  code: string;
  details: string;
  statusCode: number;
};

export const apiErrorHandler = (
  error: unknown,
  options: ErrorHandlerOptions = {},
): HandlerReturnType => {
  const { defaultMessage = "Something went wrong.", errorMapping = {} } =
    options;

  // Check if the error is an instance of AxiosError
  if (error instanceof AxiosError) {
    const backendError: ApiErrorResponse["error"] = error.response?.data.error;
    const backendErrorCode = backendError?.code || "UNKNOWN_ERROR";
    const backendErrorStatus = error.response?.status || 500;

    // If the error code is INTERNAL_SERVER_ERROR, return it with the default message
    if (backendErrorCode === "INTERNAL_SERVER_ERROR") {
      return {
        status: "error",
        code: backendErrorCode,
        details: defaultMessage,
        statusCode: backendErrorStatus,
      };
    }

    // Handle specific error codes if provided in errorMapping
    if (errorMapping[backendErrorCode]) {
      const errorCodeMapping = errorMapping[backendErrorCode];

      if (errorCodeMapping) {
        // If the errorMapping is a string, return it directly with status code
        if (typeof errorCodeMapping === "string") {
          return {
            status: "error",
            code: backendErrorCode,
            details: errorCodeMapping,
            statusCode: backendErrorStatus,
          };
        }

        // If the errorMapping is an object, check for specific summaries
        const errorSummaryMapping = errorCodeMapping[backendError.details];
        if (errorSummaryMapping) {
          return {
            status: "error",
            code: backendErrorCode,
            details: errorSummaryMapping,
            statusCode: backendErrorStatus,
          };
        }

        // If no specific summary is found, return the default message for this code with status code
        const defaultErrorSummaryMapping = errorCodeMapping.default;

        return {
          status: "error",
          code: backendErrorCode,
          details: defaultErrorSummaryMapping || defaultMessage,
          statusCode: backendErrorStatus,
        };
      }
    }

    // If no specific error mapping is found, return the error object as it is
    return {
      status: "error",
      code: backendErrorCode,
      details: backendError.details,
      statusCode: backendErrorStatus,
    };
  }

  // If the error is not an AxiosError, return a generic error response
  return {
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    details: defaultMessage,
    statusCode: 500,
  };
};
