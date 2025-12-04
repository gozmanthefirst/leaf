# Plan: Comprehensive Improvement of Leaf Note-Taking App

This plan addresses architecture, performance, database design, security, and feature gaps in your TanStack Start + Hono note-taking app. The focus is on handling large notes efficiently, improving scalability, and adding high-value features while removing unnecessary complexity.

---

## Steps

1. **Add critical database indexes** – Create indexes on `userId` (notes/folders), `folderId` on notes, composite index for `(userId, parentId IS NULL)` on folders in `packages/db/src/schemas/` to eliminate full table scans.

2. **Implement pagination and lazy loading** – Modify `folder-queries.ts` and `note-queries.ts` to load folder children on-demand instead of entire tree; add cursor-based pagination to `getAllNotes`.

3. **Refactor large note handling** – Implement chunked loading/streaming for notes in `$noteDetails`, add virtual scrolling to sidebar tree adapter in `tree-adapter.ts`, and consider storing large notes in separate content chunks table.

4. **Fix security gaps** – Enable rate limiting using existing `hono-rate-limiter` in `apps/api/src/index.ts`, implement per-user encryption key derivation in `encryption.ts`, and add dynamic CORS origin configuration.

5. **Add high-value missing features** – Implement soft deletes with `deletedAt` column for trash/recovery, add full-text search (consider searchable metadata index), and create Markdown export functionality.

6. **Split monolithic components** – Break down `$noteId.tsx` (1400+ lines) into separate editor, header, and sync-status components; extract tree rendering logic from sidebar.

---

## Further Considerations

1. **Search with encryption** – Encrypt titles/tags too but maintain a separate searchable index with hashed tokens, OR keep current approach with plaintext titles as a trade-off? *Recommend: Encrypt titles, allow search on folder names only.*

2. **Offline support priority** – Add service worker for offline access now, or defer to mobile app development later? *Recommend: Defer unless offline is a key differentiator.*

3. **Remove unused features?** – The `tags` feature is half-implemented (storage exists, no UI for filtering). Keep and complete it, or remove for simplicity? *Recommend: Complete it – tags are expected in note apps.*

---

## Detailed Findings

### Database Schema Issues

**Current Problems:**
- **No database indexes** – Zero explicit indexes exist. Missing: `userId` on notes/folders, `folderId` on notes, composite index on `(userId, parentId)` for root folder lookups
- **UUID as text** – IDs changed from `uuid` to `text` type, losing native UUID validation
- **Tags as text array** – Limits tag normalization, makes tag-based queries inefficient (requires `ANY()` operator), no autocomplete without full table scans
- **Content size unbounded** – No limits on note content, potential memory issues
- **No soft deletes** – Hard deletes mean no trash/recovery feature

**What's Good:**
- End-to-end encryption with AES-256-GCM
- Cascade deletes with proper foreign key constraints
- Self-referential folder structure for hierarchy
- Consistent timestamp helpers with auto-update

---

### API Architecture Issues

**Current Problems:**
- **Rate limiting not implemented** – `hono-rate-limiter` is in package.json but never used
- **CORS hardcoded** – Only allows `http://localhost:3120`
- **Inefficient folder tree loading** – Loads ALL folders and notes for user on every request
- **N+1 query in isDescendant** – Recursive DB calls to check folder ancestry
- **No pagination on getAllNotes** – Returns entire note list
- **No caching layer** – No Redis, no HTTP cache headers
- **Single encryption key** – One key for all users (key compromise = all data exposed)

**What's Good:**
- OpenAPI/Zod integration for type-safe routing
- Consistent response structure with helpers
- Well-configured Better Auth integration
- Clean middleware composition
- Secure headers middleware
- Client-side pako compression for large notes (>10KB)

---

### Frontend Architecture Issues

**Current Problems:**
- **Sidebar loads entire tree** – No virtual scrolling for large folder hierarchies
- **No error boundaries** – Missing React error boundaries
- **Editor content in memory** – TipTap holds full document, no chunking
- **Stale closure risks** – Complex useEffect dependencies
- **No offline support** – No service worker or local storage fallback
- **Axios without interceptors** – No retry logic or token refresh

**What's Good:**
- Excellent optimistic updates with rollback
- Proper SSR with TanStack Start
- Debounced autosave (750ms)
- Elegant temp ID pattern for optimistic creates
- iOS keyboard handling hook
- Custom drag-and-drop implementation

---

### Performance Bottlenecks

**Critical:**
1. Folder tree loading is O(n) – Every authenticated request can trigger full tree load
2. No indexes – Every query is a full table scan filtered by userId
3. Encryption/decryption on every read – No caching of decrypted content
4. Root folder check on every request – ensureRootFolder middleware queries DB

**Moderate:**
5. No query batching – Multiple sequential queries where JOINs would work
6. Full folder invalidation – Any note/folder change invalidates entire tree
7. TipTap extensions – Heavy editor loaded even for read mode

---

### Current Features

- ✅ User authentication (email/password)
- ✅ Email verification & password reset
- ✅ Hierarchical folders (unlimited depth)
- ✅ Rich text editor (TipTap with code blocks, lists, formatting)
- ✅ End-to-end note encryption
- ✅ Drag-and-drop organization
- ✅ Note copying
- ✅ Favorites toggle
- ✅ Tags (basic array storage)
- ✅ Auto-save with sync status indicator
- ✅ Dark/Light/System theme
- ✅ Mobile responsive design
- ✅ Keyboard shortcuts (cmd+k style)
- ✅ Read/Edit mode toggle

---

### Missing Features

**High Priority:**
- ❌ Search (encrypted content makes this complex)
- ❌ Trash/Recovery (hard deletes only)
- ❌ Note history/versions
- ❌ Export (PDF, Markdown, HTML)
- ❌ Import (Markdown, Evernote, Notion)

**Medium Priority:**
- ❌ Sharing
- ❌ Real-time collaboration
- ❌ Offline mode
- ❌ Mobile app
- ❌ Attachments/Images
- ❌ Backlinks/Graph view

**Lower Priority:**
- ❌ Templates
- ❌ Reminders/Due dates
- ❌ Browser extension
- ❌ Calendar integration
- ❌ AI features

---

### Security Concerns

**Weaknesses:**
1. Single encryption key shared by all users
2. No rate limiting (vulnerable to brute force, DoS)
3. Titles unencrypted (only content is encrypted)
4. Tags unencrypted (reveals note topics)
5. No audit logging
6. CORS too permissive for production
7. No CSP headers

**Strengths:**
- AES-256-GCM encryption for content
- Proper password hashing via Better Auth
- Session management with secure cookies
- CSRF protection via SameSite cookies
- Input validation via Zod schemas

---

### Code Quality

**Needs Improvement:**
- Long components (`$noteId.tsx` 1400+ lines, sidebar 1500+ lines)
- Magic numbers (e.g., `10240` for compression threshold)
- Inconsistent error handling
- No tests
- Sparse comments
- Several `biome-ignore` workarounds

**Strengths:**
- Full TypeScript throughout
- Clean monorepo structure
- Modern Biome linting
- Consistent naming conventions
- Well-documented Zod validators
- Auto-generated OpenAPI docs
