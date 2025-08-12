/**
 * Helper function to create a success response for API routes.
 * @param data - The data to include in the response.
 * @param details - Additional details about the response.
 * @returns An object representing the success response.
 */
export const successResponse = (data: unknown, details: string): object => {
  return {
    status: "success",
    details,
    data,
  };
};

/**
 * Helper function to create an error response for API routes.
 * @param code - The error code.
 * @param details - Additional details about the error.
 * @param fields - Validation error fields, if any.
 * @returns An object representing the error response.
 */
export const errorResponse = (
  code: string,
  details: string,
  fields?: Record<string, string>,
): object => {
  return {
    status: "error",
    error: {
      code,
      details,
      fields: fields || {},
    },
  };
};
