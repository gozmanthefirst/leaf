import db from "@repo/db";

/**
 * Returns the user with the given ID, or null if not found.
 */
export const getUserById = async (userId: string) => {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  return user;
};

/**
 * Returns the user with the given email, or null if not found.
 */
export const getUserByEmail = async (email: string) => {
  const user = await db.user.findFirst({
    where: {
      email,
    },
  });

  return user;
};
