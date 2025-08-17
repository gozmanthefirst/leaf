import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { user } from "../schema/auth-schema";

export const SignUpSchema = createInsertSchema(user, {
  email: z.email(),
  name: z.string().min(1).max(100),
  image: z.url().optional(),
})
  .extend({
    password: z.string().min(8).max(100),
    callbackUrl: z.url().optional(),
    rememberMe: z.boolean().optional(),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
  });

export const UserSelectSchema = z.object({
  user: createSelectSchema(user),
  token: z.string().nullable(),
});
