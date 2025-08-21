import { createSelectSchema } from "drizzle-zod";

import { user } from "../schemas/user-schema";

export const UserSelectSchema = createSelectSchema(user);
