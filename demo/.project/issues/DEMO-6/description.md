# Performance regression on dashboard

Dashboard load time has increased from ~200ms to ~3s after the latest deploy.

## Impact

- All users are affected
- Dashboard is the landing page, so this impacts first impression
- Reports of timeouts on slower connections

## Investigation Notes

Likely related to the new analytics query that was added in the last sprint. The query joins across 3 tables without proper indexing.

## Potential Fixes

1. Add composite index on `analytics.project_id, analytics.created_at`
2. Cache the dashboard query results with a 5-minute TTL
3. Move analytics aggregation to a background job
