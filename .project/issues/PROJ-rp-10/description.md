# Add todo feature via comments with dedicated Todos view

## What was requested

Add the ability to create todo items as comments on issues, and a dedicated "Todos" navigation view that aggregates all todos across issues with clickable links back to the source issue.

## Requirements

- Add todos from the issue detail page via an "Add Todo" button
- Todos are stored as comments with `type: "todo"` and a `done` boolean
- Todos render with a toggleable checkbox in the comments list
- New "Todos" nav menu item showing all todos across all issues
- Each todo shows its content, a checkbox, and a clickable link to the parent issue
- Filter buttons (Open / All / Closed) to filter by completion state
- Open todos sorted on top

## Acceptance criteria

- [ ] "Add Todo" button on issue detail page creates todo-type comments
- [ ] Todo comments render with checkbox in issue detail
- [ ] Toggling checkbox persists done state
- [ ] "Todos" nav link in header
- [ ] Todos view lists all todos with issue links
- [ ] Segmented filter buttons (Open/All/Closed) with counts
- [ ] Clicking issue link navigates to issue detail
- [ ] Template synced
