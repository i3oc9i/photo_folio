---
description: Complete a feature (moves from in-progress to done)
argument-hint: [feature-number-or-name]
---

Mark a feature as completed.

## Instructions

1. If no argument provided, look for the current in-progress feature
2. Otherwise find the feature matching `$ARGUMENTS` in `features/in-progress/`
3. Move the file to `features/done/`
4. Update `features/README.md` status tables
5. Mark all checkboxes in the feature file as complete `[x]`
6. Show confirmation

## After completion

Ask if the user wants to commit the feature completion.
