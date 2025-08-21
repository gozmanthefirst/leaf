import db from "@repo/database";
import { user } from "@repo/database/schemas/user-schema";
import { eq } from "drizzle-orm";

/**
 * Returns true if a user with the given ID exists.
 */
export const userExists = async (userId: string): Promise<boolean> => {
  const rows = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  return rows.length === 1;
};

/**
 * Returns the user with the given ID, or null if not found.
 */
export const getUserById = async (userId: string) => {
  const [foundUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return foundUser || null;
};
