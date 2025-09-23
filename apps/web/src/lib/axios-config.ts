import { redirect } from "@tanstack/react-router";
import axios from "axios";

import { $delSessionToken } from "@/server/utils";
import env from "./env";

const axiosClient = axios.create({
  baseURL: env.API_URL,
});

const axiosAuthed = axios.create({
  baseURL: env.API_URL,
});

// Response interceptor for axiosAuthed to check for 401 errors
axiosAuthed.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await $delSessionToken();
      throw redirect({ to: "/auth/sign-in" });
    }
    return Promise.reject(error);
  },
);

export { axiosAuthed, axiosClient };
