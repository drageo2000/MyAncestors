# /implement — Feature Implementation Workflow

Use this command to implement a feature from the spec.

## Steps
1. Read `docs/SPEC.md` for the feature requirements and priority
2. Read `docs/API.md` if the feature touches API endpoints
3. Search for existing related code and patterns in the codebase
4. Plan the implementation (schema changes, API routes, components)
5. Write failing tests first (TDD where practical)
6. Implement the feature (schema → API → component → page)
7. Run tests and fix failures: `npm test`
8. Check TypeScript: `npm run type-check`
9. Update `docs/API.md` if any API was added or changed
10. Create a conventional commit: `feat: <description>`

## Usage
```
/implement family tree visualization
/implement person profile page with photo upload
/implement GEDCOM import flow
```
