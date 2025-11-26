import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

import { user } from "../schemas/user.schema";

export const UserSelectSchema = createSelectSchema(user).extend({
  image: z.string().nullable().optional(),
});

export const UserUpdateSchema = createUpdateSchema(user)
  .pick({
    name: true,
    image: true,
  })
  .extend({
    name: z.string().min(1).max(100),
    image: z.url(),
  })
  .partial();
