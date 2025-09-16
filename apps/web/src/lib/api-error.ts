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

  // Check if it's a serialized axios error from server function
  // biome-ignore lint/suspicious/noExplicitAny: needed to check for serialized axios error
  const isSerializedAxiosError = (err: any): boolean => {
    return err?.isAxiosError && err.response?.data?.status === "error";
  };

  if (isSerializedAxiosError(error)) {
    // biome-ignore lint/suspicious/noExplicitAny: the error type is not known at this point
    const axiosError = error as any;
    const backendError: ApiErrorResponse["error"] =
      axiosError.response.data.error;
    const backendErrorCode = backendError.code;
    const backendErrorStatus = axiosError.response.status;

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

  // If the error is not a serialized axios error, return a generic error response
  return {
    status: "error",
    code: "SERVER_ERROR",
    details: defaultMessage,
    statusCode: 500,
  };
};
