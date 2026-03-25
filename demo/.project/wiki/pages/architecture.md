# Architecture Overview

## System Diagram

The application follows a standard 3-tier architecture:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────▶│   API Layer  │────▶│  Database    │
│   (React)    │◀────│  (Express)   │◀────│ (PostgreSQL) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    Cache     │
                    │   (Redis)    │
                    └─────────────┘
```

## Key Patterns

### Authentication
- JWT-based authentication with refresh tokens
- Sessions stored in Redis with 24h TTL
- RBAC with three roles: admin, member, viewer

### API Design
- RESTful endpoints following OpenAPI 3.0
- Rate limiting: 100 req/min for authenticated, 20 req/min for anonymous
- Request validation with Zod schemas

### Data Layer
- PostgreSQL with Knex.js query builder
- Migration-based schema management
- Soft deletes on all entities

## Deployment

- Docker-based deployment via GitHub Actions
- Staging: auto-deploy on merge to `develop`
- Production: manual approval gate after staging tests pass
