import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const dbInit = (dbUrl: string) => {
  const adapter = new PrismaPg({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
};

export * from "../generated/prisma/client";
export { dbInit };
