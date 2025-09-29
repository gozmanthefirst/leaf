import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import env from "./lib/env";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const db = new PrismaClient({ adapter });

export * from "../generated/prisma/client";
export { db };
