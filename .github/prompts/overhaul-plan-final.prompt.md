# Plan: Comprehensive Improvement of Leaf Note-Taking App (Final)

## Final Decisions

| Item | Decision |
|------|----------|
| Background migration | One-time script with progress tracking |
| `react-arborist` styling | Keep existing styles, adapt arborist to match |
| Root folder creation | Call API endpoint from web's Better Auth hook (cleaner separation, avoids DB access duplication) |

---

## Approved Changes Summary

| Item | Decision |
|------|----------|
| Database indexes | ✅ Implement |
| Dynamic CORS | ✅ Implement |
| Soft deletes | ✅ Implement |
| Rate limiting | ✅ Generous limits |
| Pagination & lazy loading | ✅ Implement |
| Virtual scrolling | ✅ Use `react-arborist` |
| Per-user encryption | ✅ Server-side derivation + background migration |
| Content size limit | ✅ 2MB limit |
| N+1 isDescendant fix | ✅ CTE query |
| HTTP ETags + 412 handling | ✅ Implement |
| In-memory LRU cache | ✅ For sessions |
| Client-side decrypted cache | ✅ With `staleTime` + `refetchOnWindowFocus` |
| Root folder hook | ✅ Move to web's Better Auth config |
| `tanstackStartCookies` plugin | ✅ Add to web's Better Auth |
| Tags feature | ❌ Remove |
| API auth routes | ❌ Remove |
| Session token utils | ❌ Remove |
| `ensureRootFolder` middleware | ❌ Remove |
| Offline support | ⏸️ Defer |
| Search | ⏸️ Defer |
| Redis caching | ⏸️ Defer |
| Chunking | ❌ Skip (2MB limit instead) |

---

## Implementation Steps

### Phase 1: Database & Schema

1. **Add database indexes** – Create indexes on `userId` (notes/folders), `folderId` on notes, composite index for `(userId, parentId IS NULL)` on folders in new migration file

2. **Add soft deletes** – Add `deletedAt` timestamp column to notes and folders tables

3. **Add per-user encryption columns** – Add `encryptionSalt` (text, not null for new users) and `encryptionVersion` (integer, default 1) to user table

4. **Remove tags column** – Drop `tags` from notes schema

5. **Add content size constraint** – Database check constraint `CHECK (length(content_encrypted) <= 4194304)` (4MB for encrypted+compressed)

### Phase 2: API Improvements

6. **Fix N+1 isDescendant** – Replace recursive loop in `folder-queries.ts` with single recursive CTE query

7. **Implement lazy loading API** – New `GET /folders/:id/children` endpoint returning direct children folders + notes + `hasChildren` boolean hint

8. **Add HTTP ETags** – Add `ETag` header (using `updatedAt` timestamp) to `GET /notes/:id` response, handle `If-None-Match` returning `304 Not Modified`

9. **Add 412 Precondition Failed** – In `PUT /notes/:id`, check `If-Match` header against current `updatedAt`, return 412 if mismatch

10. **Add in-memory LRU cache** – Create LRU cache for session lookups in `authMiddleware` with 5-minute TTL, ~1000 entry max

11. **Implement per-user key derivation** – Modify `encryption.ts` to use `scrypt(MASTER_KEY, salt + userId, 32)` for per-user keys

12. **Add content size validation** – Return `413 Payload Too Large` for notes exceeding 2MB uncompressed in create/update handlers

13. **Enable rate limiting** – Configure `hono-rate-limiter`: 100 req/min for auth endpoints, 1000 req/min for general API

14. **Configure dynamic CORS** – Read `CORS_ORIGINS` from env (comma-separated), parse into array for cors middleware

15. **Add root folder creation endpoint** – New `POST /folders/root` endpoint that creates root folder for authenticated user (called from web's Better Auth hook)

16. **Remove API auth routes** – Delete `apps/api/src/routes/auth/` directory and remove route registration from index

17. **Remove `ensureRootFolder` middleware** – Delete `apps/api/src/middleware/ensure-root-folder.ts` and remove from route chains

18. **Use JOINs** – Refactor folder/note queries to use JOINs instead of sequential queries where applicable

19. **Create migration script** – One-time script in `packages/db/scripts/migrate-encryption.ts` to re-encrypt all notes with per-user keys, update `encryptionVersion` to 2, with progress logging

### Phase 3: Frontend Improvements

20. **Add `tanstackStartCookies` plugin** – Add `tanstackStartCookies()` as last plugin in `apps/web/src/lib/better-auth.ts`

21. **Add root folder creation hook** – Add `databaseHooks.user.create.after` to web's Better Auth config that calls `POST /folders/root` API endpoint

22. **Remove session token utils** – Delete `$createSessionToken`, `$delSessionToken`, `$getSessionToken` from `server-utils.ts`

23. **Remove `normalizeTokenEncoding`** – Delete function from `utils.ts`

24. **Remove `sessionMiddleware`** – Delete `apps/web/src/middleware/auth-middleware.ts` and remove all usages

25. **Simplify auth server functions** – Update `apps/web/src/server/auth.ts` to use `authClient` methods directly, remove API call wrappers

26. **Configure client-side caching** – Add `staleTime: 5 * 60 * 1000` (5 min) and `refetchOnWindowFocus: true` to note query options in `apps/web/src/server/note.ts`

27. **Add 412 conflict handling** – In note save mutation, catch 412 response, fetch fresh data, show user conflict dialog with options to overwrite or merge

28. **Add content size validation** – In TipTap `onUpdate`, show warning toast at 1MB, prevent save and show error at 2MB

29. **Implement `react-arborist`** – Replace custom tree rendering in `app-sidebar.tsx` with `Tree` component from `react-arborist`, configure with existing styles

30. **Remove custom DnD logic** – Delete `use-tree-dnd.ts` hook (functionality replaced by `react-arborist`)

31. **Implement lazy loading** – Configure `react-arborist` with `onLoadChildren` callback that fetches from `GET /folders/:id/children`

32. **Split `$noteId.tsx`** – Extract into separate files:
    - `components/note/NoteEditor.tsx` – TipTap setup and content handling
    - `components/note/NoteHeader.tsx` – Title, breadcrumb, actions
    - `components/note/SyncStatusIndicator.tsx` – Save state display
    - `hooks/use-note-sync.ts` – Autosave logic and debouncing

33. **Add error boundary comments** – Add `// TODO: Add ErrorBoundary here` comments at component boundaries where errors should be caught gracefully

---

## File Changes Summary

### New Files
- `packages/db/src/migrations/XXXX_add_indexes_and_soft_deletes.sql`
- `packages/db/scripts/migrate-encryption.ts`
- `apps/web/src/components/note/NoteEditor.tsx`
- `apps/web/src/components/note/NoteHeader.tsx`
- `apps/web/src/components/note/SyncStatusIndicator.tsx`
- `apps/web/src/hooks/use-note-sync.ts`

### Deleted Files
- `apps/api/src/routes/auth/auth.handlers.ts`
- `apps/api/src/routes/auth/auth.index.ts`
- `apps/api/src/routes/auth/auth.routes.ts`
- `apps/api/src/middleware/ensure-root-folder.ts`
- `apps/web/src/middleware/auth-middleware.ts`
- `apps/web/src/hooks/use-tree-dnd.ts`

### Major Modifications
- `packages/db/src/schemas/user.schema.ts` – Add encryption columns
- `packages/db/src/schemas/note.schema.ts` – Remove tags, add deletedAt
- `packages/db/src/schemas/folder.schema.ts` – Add deletedAt
- `apps/api/src/lib/encryption.ts` – Per-user key derivation
- `apps/api/src/queries/folder-queries.ts` – CTE, lazy loading, JOINs
- `apps/api/src/index.ts` – Rate limiting, dynamic CORS
- `apps/web/src/lib/better-auth.ts` – Plugins, hooks
- `apps/web/src/lib/server-utils.ts` – Remove token functions
- `apps/web/src/lib/utils.ts` – Remove normalizeTokenEncoding
- `apps/web/src/server/auth.ts` – Simplify to use authClient
- `apps/web/src/server/note.ts` – Caching config, 412 handling
- `apps/web/src/routes/_main/route.tsx` – react-arborist integration
- `apps/web/src/routes/_main/$noteId.tsx` – Split into components

---

## Technical Details

### How Pagination & Lazy Loading Works

**Current problem:** `getRootFolderWithNestedItems` loads ALL folders and ALL notes for a user, then builds hierarchy in memory.

**Solution: Shallow loading with on-demand children**

1. **Initial load**: Fetch only root folder + its direct children (1 level deep)
2. **On folder expand**: API call to `/folders/:id/children` fetches that folder's children
3. **Include `hasChildren` hint**: Each folder includes a boolean so UI shows expand arrow without fetching
4. **Cache expanded folders**: TanStack Query caches each level, no re-fetch on collapse/expand

This turns O(n) initial load into O(1) with lazy O(depth) on navigation.

### How Per-User Encryption Key Derivation Works

**Solution: Server-side key derivation**

1. **Add `encryptionSalt` column** to user table (random 32 bytes per user, generated at signup)
2. **Derive per-user key** using scrypt:
   ```
   userKey = scrypt(MASTER_KEY, salt + userId, 32 bytes)
   ```
3. **Each user gets unique key** even with same master key
4. **Compromise isolation**: Attacker needs both master key AND user's salt to decrypt

**Migration path:** Add `encryptionVersion` column. New notes use v2 (per-user). Run one-time script to re-encrypt existing notes.

### How Client-Side Decrypted Content Caching Works

TanStack Query's `staleTime` + `refetchOnWindowFocus` handles cross-device consistency:

```typescript
const noteQueryOptions = (noteId: string) => queryOptions({
  queryKey: ['note', noteId],
  queryFn: () => fetchNote(noteId),
  staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
  gcTime: 30 * 60 * 1000,   // 30 minutes - keep in cache
  refetchOnWindowFocus: true, // Refetch when user returns to tab
  refetchOnReconnect: true,   // Refetch when coming back online
});
```

**Conflict handling with ETags:**
- Server includes `ETag` header with note's `updatedAt`
- Client sends `If-Match` when saving
- Server returns `412 Precondition Failed` if note changed
- Client fetches fresh, shows conflict dialog

### How N+1 isDescendant Fix Works

**Current:** Loop that calls `getFolderForUser` per level. 10 levels = 10 queries.

**Solution: Single recursive CTE query**

```sql
WITH RECURSIVE ancestors AS (
  SELECT id, parent_folder_id, is_root
  FROM folder
  WHERE id = $targetId AND user_id = $userId
  
  UNION ALL
  
  SELECT f.id, f.parent_folder_id, f.is_root
  FROM folder f
  INNER JOIN ancestors a ON f.id = a.parent_folder_id
  WHERE a.is_root = false
)
SELECT EXISTS (
  SELECT 1 FROM ancestors WHERE parent_folder_id = $folderId
) as is_descendant
```

Single query regardless of depth. No schema changes needed.

### Content Size Limit

- **2MB uncompressed** hard limit (covers 99.9% of text-only notes)
- **1MB** soft warning in UI
- Compresses to ~200-500KB typically
- Database constraint: 4MB for encrypted+compressed content
