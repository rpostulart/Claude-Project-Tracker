Add subpages here to steer Claude Code and document project conventions.

## How Steering Files Work

Pages under "Steering Files" are read by Claude Code before starting any work. Use them to define:

- **Coding Standards** — naming conventions, formatting, patterns to use or avoid
- **Architecture** — system design, tech stack choices, constraints
- **Team** — who works on what, review processes, communication
- **Deployment** — environments, CI/CD, release process
- **Company Context** — product goals, customer needs, business rules

## Example: Coding Standards

Create a subpage called "Coding Standards" with content like:

- Use TypeScript strict mode for all new files
- Use Tailwind CSS for styling, no inline styles
- All API endpoints must return `{ data, error }` envelope
- Use `snake_case` for database columns, `camelCase` for JS/TS
- Write tests for all business logic, minimum 80% coverage
