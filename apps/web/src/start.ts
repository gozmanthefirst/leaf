import { createStart } from "@tanstack/react-start";

import { axiosErrorAdapter } from "@/utils/error";

export const startInstance = createStart(() => {
  return {
    serializationAdapters: [axiosErrorAdapter],
  };
});
