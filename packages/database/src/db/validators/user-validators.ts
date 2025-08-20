import { createSelectSchema } from "drizzle-zod";

import { user } from "../schemas/auth-schema";

export const UserSelectSchema = createSelectSchema(user);
