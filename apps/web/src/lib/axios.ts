import axios from "axios";

import env from "./env";

const axiosClient = axios.create({
  baseURL: env.API_URL,
});
const axiosBase = axios.create({
  baseURL: env.BETTER_AUTH_URL,
});

export { axiosBase, axiosClient };
