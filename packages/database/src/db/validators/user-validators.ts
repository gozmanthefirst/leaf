import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { user } from "../schemas/user-schema";

export const UserSelectSchema = createSelectSchema(user);

export const UserUpdateSchema = createInsertSchema(user, {
  name: z.string().min(1).max(100),
  image: z.url(),
})
  .omit({
    id: true,
    email: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();
