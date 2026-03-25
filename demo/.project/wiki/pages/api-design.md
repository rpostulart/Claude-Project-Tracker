Detailed documentation of our REST API design patterns and conventions.

## URL Structure

All endpoints follow the pattern: `/api/v1/{resource}/{id?}/{sub-resource?}`

## Authentications

All API requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

## Response Format

All responses follow a consistent envelope:

```json
{
  "data": { ... },
  "meta": {
    "requestId": "abc-123",
    "timestamp": "2026-03-25T10:00:00Z"
  }
}
```

## Error Handling

Errors return appropriate HTTP status codes with a body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [...]
  }
}
```

## Pagination

List endpoints support cursor-based pagination:

```
GET /api/v1/users?cursor=abc&limit=20
```