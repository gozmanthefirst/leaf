import { AxiosError } from "axios";

/**
 * Transforms AxiosError into a serializable error for TanStack Start server functions.
 * This should only be used in server functions when the error needs to be handled on the client.
 */
export const transformAxiosError = (error: unknown): Error => {
  if (error instanceof AxiosError && error.response) {
    // Create a plain Error object that's serializable
    const serializedError = new Error(error.message);

    // Add the response data as plain object properties
    Object.assign(serializedError, {
      isAxiosError: true,
      response: {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      },
      code: error.code,
    });

    return serializedError;
  }

  // Re-throw other errors as-is
  if (error instanceof Error) {
    return error;
  }

  // Convert unknown errors to Error objects
  return new Error(String(error));
};
