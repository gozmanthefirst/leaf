import { createSerializationAdapter } from "@tanstack/react-router";
import { AxiosError, type AxiosResponse } from "axios";

import type { ApiErrorResponse } from "@/lib/types";

export const axiosErrorAdapter = createSerializationAdapter({
  key: "axiosError",
  test: (err): err is AxiosError => {
    return err instanceof AxiosError && err.response !== undefined;
  },
  toSerializable: (err) => {
    return {
      message: err.message,
      data: err.response?.data as ApiErrorResponse,
      status: err.response?.status,
      statusText: err.response?.statusText,
    };
  },
  fromSerializable: (errObj) => {
    const error = new AxiosError(errObj.message);

    error.response = {
      status: errObj.status,
      data: errObj.data,
      statusText: errObj.statusText,
    } as AxiosResponse<ApiErrorResponse>;

    return error;
  },
});
