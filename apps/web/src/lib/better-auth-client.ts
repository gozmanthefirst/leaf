import { createAuthClient } from "better-auth/react";

// The client will automatically use the current origin for auth requests
export const authClient = createAuthClient();
