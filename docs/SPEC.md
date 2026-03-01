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
Tree
  id, name, ownerId (userId), createdAt

Person
  id, treeId, firstName, lastName, birthDate, deathDate, birthPlace
  bio, gender, profilePhotoUrl, createdAt, deletedAt (soft delete)

Relationship
  id, personAId, personBId
  type: "PARENT_OF" | "SPOUSE_OF"

Story
  id, treeId, authorId, title, content (rich text), audioUrl
  personIds[] (many-to-many via StoryPerson join table)
  createdAt

Photo
  id, treeId, url, caption, takenAt, uploadedBy
  personIds[] (many-to-many via PhotoPerson join table)
```

## Feature Breakdown

### P0 — MVP (must ship)
- [x] Auth: sign up / login (Clerk) — integrated via @clerk/nextjs + proxy.ts
- [x] Create and name a family tree — `POST /api/trees` creates tree + root person
- [x] Add persons to tree with basic fields — `POST /api/persons`
- [x] Link relationships: parent/child, spouse — `POST /api/relationships`
- [x] Interactive tree visualization (@xyflow/react) — FamilyTreeCanvas + PersonNode components scaffolded
- [x] Person profile page with photo + bio — PersonProfile component + `/person/[id]` page scaffolded
- [ ] Photo upload to S3 — API route scaffolded; S3 integration not yet wired up

### P1 — Core value
- [ ] Story recording (rich text editor) — `/api/stories` endpoint planned; UI not built
- [ ] Photo gallery with multiple photos per person
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
- `/api/trees` — CRUD trees
- `/api/persons` — CRUD persons
- `/api/relationships` — link/unlink persons
- `/api/tree/:personId` — get full family tree graph
- `/api/stories` — CRUD stories (planned)
- `/api/photos` — upload / list / delete photos (planned)
- `/api/import/gedcom` — GEDCOM file import (planned)
