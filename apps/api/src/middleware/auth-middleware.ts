import { createMiddleware } from "hono/factory";

import { auth } from "@/lib/auth";
import type { AppBindings } from "@/lib/types";
import { errorResponse } from "@/utils/api-response";
import HttpStatusCodes from "@/utils/http-status-codes";

// Simple LRU cache for session lookups
// Max 1000 entries, 5-minute TTL
const SESSION_CACHE_MAX_SIZE = 1000;
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CachedSession = {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  expiresAt: number;
};

const sessionCache = new Map<string, CachedSession>();

// Extract session token from cookie header for cache key
const getSessionToken = (headers: Headers): string | null => {
  const cookie = headers.get("cookie");
  if (!cookie) return null;

  // Look for the session cookie (leaf_auth_session)
  const match = cookie.match(/leaf_auth_session=([^;]+)/);
  return match ? match[1] : null;
};

// Evict oldest entries if cache is full
const evictIfNeeded = () => {
  if (sessionCache.size >= SESSION_CACHE_MAX_SIZE) {
    // Delete the oldest 10% of entries
    const entriesToDelete = Math.floor(SESSION_CACHE_MAX_SIZE * 0.1);
    const keys = Array.from(sessionCache.keys()).slice(0, entriesToDelete);
    for (const key of keys) {
      sessionCache.delete(key);
    }
  }
};

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const headers = c.req.raw.headers;
  const sessionToken = getSessionToken(headers);

  // Check cache first
  if (sessionToken) {
    const cached = sessionCache.get(sessionToken);
    if (cached && cached.expiresAt > Date.now() && cached.session) {
      c.set("session", cached.session.session);
      c.set("user", cached.session.user);
      return next();
    }
    // Remove expired entry
    if (cached) {
      sessionCache.delete(sessionToken);
    }
  }

  // Cache miss - fetch from auth
  const authSession = await auth.api.getSession({ headers });

  if (!authSession) {
    return c.json(
      errorResponse("UNAUTHORIZED", "No session found"),
      HttpStatusCodes.UNAUTHORIZED,
    );
  }

  // Cache the session
  if (sessionToken) {
    evictIfNeeded();
    sessionCache.set(sessionToken, {
      session: authSession,
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    });
  }

  c.set("session", authSession.session);
  c.set("user", authSession.user);

  return next();
});

// Export for testing/clearing cache
export const clearSessionCache = () => sessionCache.clear();
