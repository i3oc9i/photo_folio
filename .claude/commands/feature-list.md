---
description: List all features by status
---

Show the current status of all features.

## Instructions

1. List features in each directory:
   - `features/in-progress/` - Currently working on
   - `features/backlog/` - Planned features
   - `features/done/` - Completed features

2. For each feature, show:
   - Number and name
   - First line of description (from the file)
   - Priority and effort if available

3. Format as a clear summary table

## Output format

```
## In Progress
- 001-feature-name: Brief description

## Backlog (4 features)
- 002-feature-name: Brief description [Priority: High, Effort: 1h]
- ...

## Done (2 features)
- 003-feature-name: Completed
```
