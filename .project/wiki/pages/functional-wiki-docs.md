# Wiki Documentation System

The wiki uses three documentation types, each with a clear purpose and audience.

## How to Use

When completing an issue, run `/document-completion`. It analyzes your work and creates the appropriate docs:

| Type | When | Audience |
|------|------|----------|
| **Functional** | Feature or UI change | End users, stakeholders |
| **Technical** | Architecture or API change | Developers |
| **Decisions** | Non-obvious choice made | Future maintainers |

Pages are automatically nested under their parent category (`functional/`, `technical/`, `decisions/`) in the wiki sidebar.

## Example

After implementing a fact-checking feature:
- **Functional doc** — "The system verifies real-world claims (locations, landmarks) during generation and auto-corrects errors."
- **Technical doc** — Data flow, S3 storage, prompt structure, configuration.
- **Decision record** — "Chose inline checking over separate Lambda agent because..."

## Notes

- Issue comments serve as the work log (no separate solution log needed)
- At least one doc type should be created per completed issue
- Add `skip-docs` label to trivial issues that don't need documentation
