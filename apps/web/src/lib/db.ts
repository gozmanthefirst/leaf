import { dbInit } from "@repo/db";

import env from "./env";

export const db = dbInit(env.DATABASE_URL);
