# Local Development

Detailed guide for setting up your local development environment.

## Database Setup

```bash
# Start PostgreSQL via Docker
docker compose up -d postgres

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

## Hot Reload

The dev server supports hot reload out of the box. Changes to source files will trigger an automatic restart.

```bash
npm run dev
```

## Running Tests Locally

```bash
# Unit tests
npm test

# Integration tests (requires running database)
npm run test:integration

# E2E tests
npm run test:e2e
```
