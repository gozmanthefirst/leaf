export const successResponse = (details: string, data: unknown): object => {
  return {
    status: "success",
    data,
    details,
  };
};

export const errorResponse = (
  errorCode: string,
  details: string,
  data?: unknown,
): object => {
  if (data) {
    return {
      status: "error",
      errorCode,
      details,
      data,
    };
  } else {
    return {
      status: "error",
      errorCode,
      details,
    };
  }
};
