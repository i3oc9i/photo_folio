---
description: Start working on a feature (moves from backlog to in-progress)
argument-hint: <feature-number-or-name>
---

Move a feature from backlog to in-progress.

## Instructions

1. Find the feature file matching `$ARGUMENTS` in `features/backlog/`
   - Match by number (e.g., "001") or partial name
2. If multiple matches, list them and ask which one
3. If no matches, list available features in backlog
4. Move the file to `features/in-progress/`
5. Update `features/README.md` status tables
6. Show confirmation with the feature summary

## Rules

- Only one feature should be in-progress at a time (warn if there's already one)
- Read the feature file and summarize what will be implemented
