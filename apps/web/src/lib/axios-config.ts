import { redirect } from "@tanstack/react-router";
import { deleteCookie } from "@tanstack/react-start/server";
import axios from "axios";

import env from "./env";

const cookieName =
  env.NODE_ENV === "development"
    ? env.AUTH_COOKIE
    : `__Secure-${env.AUTH_COOKIE}`;

const deleteSessionToken = () => {
  deleteCookie(cookieName);
};

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
      deleteSessionToken();
      throw redirect({ to: "/auth/sign-in" });
    }
    return Promise.reject(error);
  },
);

export { axiosAuthed, axiosClient };
