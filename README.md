# MyAncestors

Personal genealogy tracker — family tree mapping, photo uploads, story recording, and heritage discovery.

## Features

- **Family Tree Visualization** — interactive graph powered by @xyflow/react
- **Person Profiles** — bio, dates, birthplace, photos per person
- **Relationships** — parent/child and spouse links; supports blended families
- **Stories** — rich text stories linked to one or more persons
- **Photos** — photo gallery with person tagging
- **Auth** — sign up / login via Clerk (email + social)

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Tree viz | @xyflow/react |
| Database | PostgreSQL + Prisma 5 |
| Auth | Clerk |
| Storage | AWS S3 / Cloudflare R2 (planned) |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ running locally (or use Docker — see below)
- Clerk account (for auth keys)

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env

# 3. Run database migrations
npx prisma migrate dev

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Running with Docker

Requires Docker Desktop (or Docker Engine + Compose plugin).

```bash
# Copy env template and fill in Clerk keys
cp .env.example .env

# Build and start all services (db + migrations + app)
docker compose up --build

# Stop
docker compose down
```

The app will be available at [http://localhost:3000](http://localhost:3000).

> **Note:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be set in `.env` before building — it is baked into the JS bundle at build time.

## Environment Variables

See `.env.example` for the full list. Required to run:

```
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```

## Project Structure

```
src/
  app/                   # Next.js App Router pages + API routes
    api/                 # REST API handlers
    (auth)/              # Clerk sign-in / sign-up pages
    tree/                # Family tree page
    person/[id]/         # Person profile page
    stories/             # Stories list page
  components/
    layout/              # Navbar, shell
    tree/                # FamilyTreeCanvas, PersonNode
    person/              # PersonProfile
  lib/
    db.ts                # Prisma singleton
    api.ts               # Response helpers
prisma/
  schema.prisma          # Data model + migrations
docs/                    # Spec, architecture, API reference
```

## Documentation

- [Product Spec](docs/SPEC.md)
- [Architecture Decisions](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
