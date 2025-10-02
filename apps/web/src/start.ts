import { createStart } from "@tanstack/react-start";

import { axiosErrorAdapter } from "@/lib/error";

export const startInstance = createStart(() => {
  return {
    serializationAdapters: [axiosErrorAdapter],
  };
});
