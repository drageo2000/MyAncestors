# MyAncestors

## Project Overview
Personal genealogy tracker: family tree mapping, photo uploads, story recording, heritage discovery.
Users log in, create a tree starting from themselves, and can add ancestors (parents, grandparents, etc.) and descendants (kids, grandkids, etc.).

## Tech Stack
- Framework: Next.js 16.1.6 (App Router)
- Frontend: React 19 + TypeScript + Tailwind CSS
- Tree Visualization: @xyflow/react (NOT react-flow / react-flow-renderer — those are React 16-18 only)
- Tree Layout: @dagrejs/dagre (hierarchical graph layout, top-down)
- Backend: Next.js API Routes
- Database: PostgreSQL + Prisma 5 ORM (NOT Prisma 7 — breaking changes)
- Auth: Clerk (@clerk/nextjs)
- Storage: Cloudflare R2 (S3-compatible, via @aws-sdk/client-s3) — server-side upload via multipart form data
- Image Compression: browser-image-compression (client-side, before upload)
- Import: GEDCOM parser — not yet implemented

## Architecture
- /src/app — Next.js App Router pages & API routes
  - /src/app/api/trees — Tree CRUD
  - /src/app/api/persons — Person CRUD + list by treeId
  - /src/app/api/persons/[id] — Person GET/PATCH/DELETE (soft-delete)
  - /src/app/api/relationships — Create relationship
  - /src/app/api/tree/[personId] — Full family graph as { nodes, edges }
  - /src/app/api/photos — Photo metadata CRUD (GET list, POST create)
  - /src/app/api/photos/upload — File upload to R2 (multipart form data)
  - /src/app/api/photos/[id] — Delete photo (+ R2 cleanup)
  - /src/app/sign-in, /src/app/sign-up — Clerk auth pages
  - /src/app/onboarding — New user tree creation flow (2-step)
  - /src/app/tree — Tree visualization page (server → TreePageClient)
  - /src/app/person/[id] — Person profile page
  - /src/app/stories — Stories listing page
- /src/components — Reusable UI components
  - /src/components/layout — Navbar
  - /src/components/tree — FamilyTreeCanvas, PersonNode, AddPersonModal, TreePageClient
  - /src/components/person — PersonProfile, PhotoUpload
  - /src/components/onboarding — OnboardingForm
- /src/lib — Utilities, DB client, helpers (db.ts, api.ts)
- /src/middleware.ts — Clerk auth middleware (protects /tree, /person, /stories, /onboarding)
- /src/proxy.ts — Clerk route protection (Next.js 16 renamed middleware.ts → proxy.ts)
- /prisma — Schema (schema.prisma)
- /docs — Specs, architecture decisions, API reference
- /public — Static assets

## Conventions
- File naming: kebab-case for files, PascalCase for components
- API responses: `{ data, error, meta }`
- Tests: colocated `*.test.ts` files
- Commits: conventional commits (feat:, fix:, chore:, etc.)
- Soft-delete for persons (deletedAt timestamp)
- Clerk route protection lives in `src/proxy.ts` (Next.js 16 renamed middleware.ts → proxy.ts)

## Data Model (key entities)
- User — id (Clerk ID), email, name
- Tree — id, name, ownerId (userId)
- Person — id, firstName, lastName, birthDate, deathDate, birthPlace, gender (enum), bio, profilePhotoUrl, treeId, deletedAt (soft delete)
- Relationship — personAId, personBId, type (PARENT_OF | SPOUSE_OF), unique on [personAId, personBId, type]
- Story — id, title, content (Text), audioUrl, treeId, authorId
- Photo — id, url, caption, takenAt, treeId, uploadedById
- StoryPerson — join table (storyId, personId)
- PhotoPerson — join table (photoId, personId)

## Workflows
- Feature: read SPEC.md → plan → code → test → commit
- Bug fix: reproduce → investigate → fix → test → commit
- Before implementing, always check docs/SPEC.md for requirements

## Key Decisions
- Family trees are directed graphs; adjacency list in PostgreSQL with Relationship table
- Tree layout computed client-side using dagre (hierarchical TB, parents above children, spouses side-by-side)
- Photos uploaded server-side to Cloudflare R2 via multipart form data (not presigned URLs)
- R2 public URL serves images directly (no CDN layer currently)
- Client-side image compression before upload (browser-image-compression, max 1MB / 1920px)
- GEDCOM import is the standard format supported by Ancestry, FamilySearch, MyHeritage
- Prisma binaryTargets includes "linux-musl-arm64-openssl-3.0.x" for Docker ARM64 compatibility
- Edge styling: PARENT_OF = solid stone line, SPOUSE_OF = dashed amber line

## Docker Notes
- Base image: node:20-slim (Debian Bookworm) — NOT node:20-alpine (Alpine lacks libssl.so.1.1)
- OpenSSL installed via apt-get in Dockerfile
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be passed as a Docker build ARG — it is baked into the bundle at build time
- Three services: db (postgres:16-alpine), migrate (runs prisma migrate deploy), app
- Compose file: docker-compose.yml

## Local Dev Notes
- Homebrew PostgreSQL uses the macOS username (e.g. urnam) as the DB user, not "postgres"
- DATABASE_URL format: postgresql://<macOS-username>@localhost:5432/myancestors
- Run migrations: `npx prisma migrate dev --name <name>`

## Environment Variables
See `.env.example` for all required variables:
- DATABASE_URL — PostgreSQL connection string
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY — Clerk auth
- R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / R2_PUBLIC_URL — Cloudflare R2 storage
