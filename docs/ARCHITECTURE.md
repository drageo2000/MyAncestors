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
- Note: use `@xyflow/react` — not `react-flow` or `react-flow-renderer` (those only support React 16–18)

## ADR-003: Storage Strategy
- Photos and audio stored in S3-compatible storage (AWS S3 or Cloudflare R2)
- Presigned URLs for client-side upload (no server proxying large files)
- CloudFront CDN for persistent photo access (presigned S3 URLs expire)
- Client-side image compression with browser-image-compression before upload

## ADR-004: Auth with Clerk
- Clerk handles email/password + social login (Google, Apple)
- Clerk webhooks sync user creation to our DB (Person seed + Tree creation)
- `userId` from Clerk stored on Tree and Person for ownership checks
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is baked into the JS bundle at build time — must be provided as a Docker build ARG

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
- Prisma `binaryTargets` includes `"linux-musl-arm64-openssl-3.0.x"` for ARM64 Docker hosts (Apple Silicon)
- Three-service Compose setup: `db` (postgres:16-alpine) → `migrate` (prisma migrate deploy) → `app`
- `migrate` service uses `node:20-slim` and installs openssl before running Prisma CLI

## System Diagram
```
Browser
  │
  ├── Next.js App (SSR/RSC)  [node:20-slim container]
  │     ├── /app — Pages (tree, person, stories)
  │     └── /app/api — API routes
  │
  ├── Clerk — Auth (external)
  │
  ├── PostgreSQL 16  [postgres:16-alpine container]
  │     ├── Trees, Persons, Relationships
  │     ├── Stories, Photos (metadata)
  │     └── StoryPerson, PhotoPerson (join tables)
  │
  └── S3 / R2 — Photos, Audio, Documents  [planned]
```
