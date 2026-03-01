# MyAncestors — Product Specification

## User Personas
- **Root Seeker** (40–65): Digitizing family history, scanning old photos, connecting with distant relatives
- **Story Keeper** (25–40): Recording grandparents' stories before they're lost
- **Heritage Explorer** (18–30): Curious about cultural roots, ethnicity, migration patterns

## Core User Journey
1. Sign up → prompted to create their first Tree
2. They are added as the root Person
3. Add parents, grandparents going up the tree
4. Add children, grandchildren going down
5. Upload photos and record stories per person
6. Import existing data from GEDCOM file (Ancestry, FamilySearch exports)

## Data Model

```
User
  id (Clerk ID), email, name, createdAt

Tree
  id, name, ownerId (userId), createdAt, updatedAt

Person
  id, treeId, firstName, lastName, birthDate, deathDate, birthPlace
  bio, gender (MALE|FEMALE|OTHER|UNKNOWN), profilePhotoUrl
  createdAt, updatedAt, deletedAt (soft delete)

Relationship
  id, personAId, personBId
  type: "PARENT_OF" | "SPOUSE_OF"
  unique constraint: [personAId, personBId, type]

Story
  id, treeId, authorId, title, content (rich text), audioUrl
  personIds[] (many-to-many via StoryPerson join table)
  createdAt, updatedAt

Photo
  id, treeId, url, caption, takenAt, uploadedById
  personIds[] (many-to-many via PhotoPerson join table)
  createdAt
```

## Feature Breakdown

### P0 — MVP (must ship)
- [x] Auth: sign up / login (Clerk) — sign-in/sign-up pages, proxy.ts middleware, route protection
- [x] Create and name a family tree — onboarding flow (2-step: name tree → about you)
- [x] Add persons to tree with basic fields — AddPersonModal on tree canvas
- [x] Link relationships: parent/child, spouse — modal creates person + relationship in one flow
- [x] Interactive tree visualization (@xyflow/react) — FamilyTreeCanvas with dagre layout, edge styling
- [x] Person profile page with photo + bio — PersonProfile with family links, photos, stories
- [x] Photo upload to Cloudflare R2 — server-side multipart upload, client-side compression, gallery with set-profile/delete actions

### P1 — Core value
- [ ] Story recording (rich text editor) — stories page lists existing stories, but creation/editing UI not built
- [ ] Photo gallery with multiple photos per person — basic gallery exists, needs lightbox/expanded view
- [ ] Timeline view per person (birth → life events → death)
- [ ] GEDCOM file import
- [ ] Search persons within a tree

### P2 — Enhancements
- [ ] Heritage/ethnicity mapping on a world map
- [ ] Shared/collaborative family trees (invite by email)
- [ ] Audio story recording
- [ ] AI-powered story transcription (Whisper)
- [ ] Face tagging in photos
- [ ] Export tree as PDF / GEDCOM

## API Endpoints (see docs/API.md for full reference)
- `/api/trees` — CRUD trees (GET list, POST create with root person)
- `/api/persons` — CRUD persons (GET list by treeId, POST create)
- `/api/persons/:id` — GET/PATCH/DELETE (soft-delete) single person
- `/api/relationships` — POST to link two persons
- `/api/tree/:personId` — GET full family tree graph as { nodes, edges }
- `/api/photos` — GET list (by personId or treeId), POST create metadata
- `/api/photos/upload` — POST multipart file upload to R2
- `/api/photos/:id` — DELETE photo (metadata + R2 file)
- `/api/stories` — CRUD stories (planned)
- `/api/import/gedcom` — GEDCOM file import (planned)
