# Architecture Decision Records

## ADR-001: Next.js 16 App Router
Using Next.js 16.1.6 with the App Router for:
- SSR and RSC for fast initial loads
- File-based routing that maps naturally to /tree, /person/:id, /stories
- Collocated API routes under /app/api
- `output: "standalone"` enables minimal Docker image
- Note: Next.js 16 renamed `middleware.ts` → `proxy.ts` for route protection

## ADR-002: Graph-based Family Model
Family trees are directed graphs (not strict trees — a person can have multiple parents in blended families).
- **Storage**: adjacency list in PostgreSQL via Relationship table
- **Traversal**: recursive CTEs for getting full tree up/down from a root
- **Visualization**: @xyflow/react renders the graph client-side; nodes fetched via `/api/tree/:personId`
- **Layout**: dagre (`@dagrejs/dagre`) computes hierarchical top-down positioning client-side
  - PARENT_OF edges drive the hierarchy (rank direction: TB)
  - SPOUSE_OF edges are excluded from layout ranking (rendered as dashed amber lines)
  - Nodes are positioned by dagre then centered by subtracting half node dimensions
- Note: use `@xyflow/react` — not `react-flow` or `react-flow-renderer` (those only support React 16–18)

## ADR-003: Storage Strategy
- Photos stored in **Cloudflare R2** (S3-compatible)
- **Server-side upload**: client sends multipart form data to `/api/photos/upload`, server uploads to R2 via `@aws-sdk/client-s3`
  - Original plan was presigned URLs for direct client upload, but server-side was simpler and sufficient for current file sizes
- **R2 public URL** serves images directly (no CDN layer currently)
- Client-side image compression with `browser-image-compression` before upload (max 1MB, max 1920px)
- File validation: JPEG, PNG, WebP only, max 5MB after compression
- Files stored under `{userId}/{uuid}.{ext}` key structure in R2
- Photo delete also removes the file from R2 (local file cleanup for legacy `/uploads/` paths)

## ADR-004: Auth with Clerk
- Clerk handles email/password + social login (Google, Apple)
- User upsert happens in `POST /api/trees` (creates User record on first tree creation)
- `userId` from Clerk stored on Tree for ownership checks; all queries filter by `tree.ownerId`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is baked into the JS bundle at build time — must be provided as a Docker build ARG
- Sign-in/sign-up pages use Clerk's `<SignIn />` and `<SignUp />` components
- After sign-up → redirect to `/onboarding`; after sign-in → redirect to `/tree`

## ADR-005: GEDCOM Import
- GEDCOM (.ged) is the universal genealogy interchange format
- Supported by: Ancestry, FamilySearch, MyHeritage, MacFamilyTree
- Import flow: upload file → parse server-side → preview mapping → confirm import
- Library: `gedcom` npm package for parsing
- Status: planned, not yet implemented

## ADR-006: Soft Deletes
- Persons are soft-deleted (deletedAt timestamp) to preserve relationship/story integrity
- Hard delete only possible by tree owner, and only after soft delete confirmation

## ADR-007: Docker Deployment
- Base image: `node:20-slim` (Debian Bookworm with OpenSSL 3.x)
- **Do NOT use `node:20-alpine`** — Alpine Linux lacks `libssl.so.1.1`; Prisma's default engine requires it and fails with "error while loading shared libraries"
- OpenSSL installed via `apt-get install -y openssl` in Dockerfile
- Prisma `binaryTargets` includes `"linux-musl-arm64-openssl-3.0.x"` and `"debian-openssl-3.0.x"` for cross-platform compatibility
- Three-service Compose setup: `db` (postgres:16-alpine) → `migrate` (prisma migrate deploy) → `app`
- `migrate` service uses `node:20-slim` and installs openssl before running Prisma CLI

## ADR-008: Tree Page Architecture
- Tree page (`/tree`) uses a server component → client component pattern:
  - Server component fetches user's trees + root person IDs from DB
  - Passes data to `TreePageClient` (client component) as props
  - `TreePageClient` manages tree selection (dropdown if multiple trees) and renders `FamilyTreeCanvas`
- If user has no trees → server redirect to `/onboarding`
- `FamilyTreeCanvas` accepts `rootPersonId` and `treeId` as props
- Empty tree state shows a "Start your family tree" prompt with link to onboarding

## ADR-009: Add Person Flow
- PersonNode shows hover actions: "+ Parent", "+ Child", "+ Spouse"
- Actions open `AddPersonModal` pre-filled with relationship type and related person
- Floating "+ Add Person" button on canvas opens modal without pre-fill (user selects from dropdown)
- Modal submits two API calls sequentially: create person → create relationship
- Canvas refreshes (re-fetches graph + re-runs dagre layout) after successful add

## System Diagram
```
Browser
  │
  ├── Next.js App (SSR/RSC)  [node:20-slim container]
  │     ├── /app — Pages (landing, onboarding, tree, person, stories, sign-in, sign-up)
  │     └── /app/api — API routes (trees, persons, relationships, tree graph, photos)
  │
  ├── Clerk — Auth (external SaaS)
  │
  ├── PostgreSQL 16  [postgres:16-alpine container]
  │     ├── Users, Trees, Persons, Relationships
  │     ├── Stories, Photos (metadata)
  │     └── StoryPerson, PhotoPerson (join tables)
  │
  └── Cloudflare R2 — Photo storage (S3-compatible)
        └── Bucket: myancestors-photos
              └── {userId}/{uuid}.{ext}
```
