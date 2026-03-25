# Deployment Guide

How to deploy the application to staging and production.

## Staging

Staging deploys automatically when code is merged to `develop`.

- URL: `https://staging.example.com`
- Database: Shared staging PostgreSQL instance
- Logs: Available in CloudWatch under `/staging/app`

## Production

Production requires a manual approval step after staging tests pass.

1. Create a PR from `develop` to `main`
2. Wait for CI to pass
3. Get approval from at least one team lead
4. Merge — deployment starts automatically

## Rollback

If something goes wrong:

```bash
# List recent deployments
npm run deploy:list

# Rollback to previous version
npm run deploy:rollback
```
