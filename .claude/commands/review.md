# /review — Pre-Commit Self-Review

## Steps
1. List all changed files: `git diff --name-only`
2. Read each changed file and check for:
   - Security issues (SQL injection, XSS, exposed secrets)
   - N+1 query problems (missing Prisma `include`)
   - Missing error handling on API routes
   - Accessibility gaps in components (aria labels, keyboard nav)
   - TypeScript errors: `npm run type-check`
3. Verify all tests pass: `npm test`
4. Check that docs are updated if API changed
5. Generate a conventional commit message
6. Suggest PR description if the branch is ready to ship
