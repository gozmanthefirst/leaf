import z from "zod";

import { UserInputSchema, UserSchema } from "../../generated/zod/schemas";

export const UserSelectSchema = UserSchema;

export const UserUpdateSchema = UserInputSchema.extend({
  name: z.string().min(1).max(100),
  image: z.url(),
})
  .pick({
    name: true,
    image: true,
  })
  .partial();
