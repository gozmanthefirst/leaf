import db from "@repo/database";

/**
 * Returns the user with the given ID, or null if not found.
 */
export const getUserById = async (userId: string) => {
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });

  return user || null;
};

/**
 * Returns the user with the given email, or null if not found.
 */
export const getUserByEmail = async (email: string) => {
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
  });

  return user || null;
};
