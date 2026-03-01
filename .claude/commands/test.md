# /test — Test Workflow

## Steps
1. Identify what needs testing (changed files from `git diff`)
2. Write unit tests for pure logic (utils, parsers, helpers)
3. Write integration tests for API routes (use `supertest`)
4. Write component tests for UI (React Testing Library)
5. Run all tests: `npm test`
6. Fix any failures before proceeding
7. Check coverage: `npm run test:coverage` — aim for 80%+

## Test file conventions
- Colocate test files: `MyComponent.test.tsx` next to `MyComponent.tsx`
- API tests in `__tests__/api/`
- Shared test utilities in `src/lib/test-utils.ts`
