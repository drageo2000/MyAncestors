# API Reference

All responses follow the shape: `{ data, error, meta }`
All endpoints require authentication via Clerk session token.

Legend: ✅ implemented · 🚧 planned

---

## Trees

```
✅ POST   /api/trees              — Create a new tree (seeds the root person in a transaction)
✅ GET    /api/trees              — List trees for current user
🚧 GET    /api/trees/:id          — Get tree metadata
🚧 PATCH  /api/trees/:id          — Update tree name
🚧 DELETE /api/trees/:id          — Delete tree (and all persons/stories/photos)
```

---

## Persons

```
✅ POST   /api/persons            — Create a person (with tree ownership check)
✅ GET    /api/persons/:id        — Get person + their relationships
✅ PATCH  /api/persons/:id        — Update person fields
✅ DELETE /api/persons/:id        — Soft-delete person (sets deletedAt)
```

Request body (POST/PATCH):
```json
{
  "treeId": "string",
  "firstName": "string",
  "lastName": "string",
  "birthDate": "ISO date string",
  "deathDate": "ISO date string | null",
  "birthPlace": "string",
  "gender": "MALE | FEMALE | OTHER | UNKNOWN",
  "bio": "string"
}
```

---

## Relationships

```
✅ POST   /api/relationships      — Link two persons (PARENT_OF or SPOUSE_OF)
🚧 DELETE /api/relationships/:id  — Remove relationship
✅ GET    /api/tree/:personId     — Get full family graph from a root person
```

Request body (POST):
```json
{
  "personAId": "string",
  "personBId": "string",
  "type": "PARENT_OF | SPOUSE_OF"
}
```

Tree response (GET /api/tree/:personId):
```json
{
  "data": {
    "nodes": [{ "id": "...", "firstName": "...", "lastName": "...", "profilePhotoUrl": "..." }],
    "edges": [{ "id": "...", "source": "...", "target": "...", "type": "PARENT_OF" }]
  }
}
```

---

## Stories

```
🚧 POST   /api/stories            — Create a story
🚧 GET    /api/stories            — List stories (filter: ?personId=, ?treeId=)
🚧 GET    /api/stories/:id        — Get story
🚧 PATCH  /api/stories/:id        — Update story
🚧 DELETE /api/stories/:id        — Delete story
```

---

## Photos

```
🚧 POST   /api/photos/upload-url  — Get presigned S3 URL for upload
🚧 POST   /api/photos             — Save photo metadata after upload
🚧 GET    /api/photos             — List photos (filter: ?personId=, ?treeId=)
🚧 DELETE /api/photos/:id         — Delete photo (and S3 object)
```

---

## Import

```
🚧 POST   /api/import/gedcom      — Upload and parse a GEDCOM file
🚧 POST   /api/import/gedcom/confirm — Confirm and import parsed data
```
