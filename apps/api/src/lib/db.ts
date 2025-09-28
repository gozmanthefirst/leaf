import { env } from "cloudflare:workers";

import { dbInit } from "@repo/db";

export const db = dbInit(env.DATABASE_URL);
