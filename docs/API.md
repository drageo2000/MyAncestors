# API Reference

All responses follow the shape: `{ data, error, meta }`
All endpoints require authentication via Clerk session token.

Legend: ✅ implemented · 🚧 planned

---

## Trees

```
✅ POST   /api/trees              — Create a new tree (seeds the root person in a transaction)
✅ GET    /api/trees              — List trees for current user (includes person count)
🚧 GET    /api/trees/:id          — Get tree metadata
🚧 PATCH  /api/trees/:id          — Update tree name
🚧 DELETE /api/trees/:id          — Delete tree (and all persons/stories/photos)
```

Request body (POST):
```json
{
  "name": "string (required)",
  "rootFirstName": "string",
  "rootLastName": "string",
  "rootBirthDate": "ISO date string",
  "rootBirthPlace": "string",
  "rootGender": "MALE | FEMALE | OTHER | UNKNOWN",
  "email": "string (for User upsert)"
}
```

---

## Persons

```
✅ GET    /api/persons?treeId=    — List persons in a tree (returns id, firstName, lastName)
✅ POST   /api/persons            — Create a person (with tree ownership check)
✅ GET    /api/persons/:id        — Get person + relationships (both directions)
✅ PATCH  /api/persons/:id        — Update person fields (including profilePhotoUrl)
✅ DELETE /api/persons/:id        — Soft-delete person (sets deletedAt)
```

Request body (POST):
```json
{
  "treeId": "string (required)",
  "firstName": "string (required)",
  "lastName": "string (required)",
  "birthDate": "ISO date string",
  "deathDate": "ISO date string | null",
  "birthPlace": "string",
  "gender": "MALE | FEMALE | OTHER | UNKNOWN",
  "bio": "string"
}
```

Request body (PATCH):
```json
{
  "firstName": "string",
  "lastName": "string",
  "birthDate": "ISO date string",
  "deathDate": "ISO date string | null",
  "birthPlace": "string",
  "gender": "MALE | FEMALE | OTHER | UNKNOWN",
  "bio": "string",
  "profilePhotoUrl": "string"
}
```

---

## Relationships

```
✅ POST   /api/relationships      — Link two persons (PARENT_OF or SPOUSE_OF)
🚧 DELETE /api/relationships/:id  — Remove relationship
```

Request body (POST):
```json
{
  "personAId": "string (required)",
  "personBId": "string (required)",
  "type": "PARENT_OF | SPOUSE_OF (required)"
}
```

Notes:
- For PARENT_OF: personA is the parent, personB is the child
- Both persons must belong to the same tree
- Unique constraint on [personAId, personBId, type]

---

## Tree Graph

```
✅ GET    /api/tree/:personId     — Get full family graph from a root person
```

Response:
```json
{
  "data": {
    "nodes": [
      {
        "id": "...",
        "type": "personNode",
        "position": { "x": 0, "y": 0 },
        "data": {
          "firstName": "...",
          "lastName": "...",
          "birthDate": "...",
          "deathDate": "...",
          "profilePhotoUrl": "...",
          "isRoot": true
        }
      }
    ],
    "edges": [
      {
        "id": "...",
        "source": "personAId",
        "target": "personBId",
        "type": "PARENT_OF | SPOUSE_OF"
      }
    ]
  }
}
```

Notes:
- Returns all persons in the tree (not just ancestors/descendants of the root)
- Excludes soft-deleted persons
- Node positions are `{ x: 0, y: 0 }` — layout computed client-side by dagre

---

## Photos

```
✅ POST   /api/photos/upload      — Upload image file to Cloudflare R2 (multipart form data)
✅ POST   /api/photos             — Save photo metadata + link to persons
✅ GET    /api/photos             — List photos (filter: ?personId= or ?treeId=)
✅ DELETE /api/photos/:id         — Delete photo (metadata + R2 file)
```

Upload request (POST /api/photos/upload):
- Content-Type: `multipart/form-data`
- Field: `file` (JPEG, PNG, or WebP, max 5MB)
- Response: `{ data: { url: "https://r2-public-url/userId/uuid.ext" } }`

Metadata request (POST /api/photos):
```json
{
  "url": "string (required — from upload response)",
  "treeId": "string (required)",
  "personIds": ["string"] ,
  "caption": "string (optional)"
}
```

List request (GET /api/photos):
- Query params: `?personId=` or `?treeId=` (at least one required)

---

## Stories

```
🚧 POST   /api/stories            — Create a story
🚧 GET    /api/stories            — List stories (filter: ?personId=, ?treeId=)
🚧 GET    /api/stories/:id        — Get story
🚧 PATCH  /api/stories/:id        — Update story
🚧 DELETE /api/stories/:id        — Delete story
```

Note: Stories page exists and reads from DB (server component), but no creation/editing API routes yet.

---

## Import

```
🚧 POST   /api/import/gedcom      — Upload and parse a GEDCOM file
🚧 POST   /api/import/gedcom/confirm — Confirm and import parsed data
```
