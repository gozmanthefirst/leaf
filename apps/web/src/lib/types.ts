export type ApiSuccessResponse<T = undefined> = {
  status: "success";
  details: string;
  data: T;
};

export type ApiErrorResponse = {
  status: "error";
  error: {
    code: string;
    details: string;
    fields: Record<string, string>;
  };
};
