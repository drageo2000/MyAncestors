# MyAncestors

## Project Overview
Personal genealogy tracker: family tree mapping, photo uploads, story recording, heritage discovery.
Users log in, create a tree starting from themselves, and can add ancestors (parents, grandparents, etc.) and descendants (kids, grandkids, etc.).

## Tech Stack
- Framework: Next.js 16.1.6 (App Router)
- Frontend: React 19 + TypeScript + Tailwind CSS
- Tree Visualization: @xyflow/react (NOT react-flow / react-flow-renderer — those are React 16-18 only)
- Backend: Next.js API Routes
- Database: PostgreSQL + Prisma 5 ORM (NOT Prisma 7 — breaking changes)
- Auth: Clerk (@clerk/nextjs)
- Storage: AWS S3 / Cloudflare R2 (photos & documents) — not yet implemented
- Import: GEDCOM parser — not yet implemented

## Architecture
- /src/app — Next.js App Router pages & API routes
- /src/components — Reusable UI components
- /src/lib — Utilities, DB client, helpers
- /prisma — Schema and migrations
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
- Person — id, firstName, lastName, birthDate, deathDate, bio, treeId, userId
- Relationship — personAId, personBId, type (PARENT_OF | SPOUSE_OF)
- Story — id, content, personIds[], authorId
- Photo — id, url, personIds[], caption, takenAt
- Tree — id, name, ownerId

## Workflows
- Feature: read SPEC.md → plan → code → test → commit
- Bug fix: reproduce → investigate → fix → test → commit
- Before implementing, always check docs/SPEC.md for requirements

## Key Decisions
- Family trees are directed graphs; adjacency list in PostgreSQL with Relationship table
- Photos stored in S3; metadata + relationships in PostgreSQL
- GEDCOM import is the standard format supported by Ancestry, FamilySearch, MyHeritage
- Client-side image compression before upload (browser-image-compression)
- Prisma binaryTargets includes "linux-musl-arm64-openssl-3.0.x" for Docker ARM64 compatibility

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
