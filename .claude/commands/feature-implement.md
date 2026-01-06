---
description: Implement a feature (moves from backlog to in-progress and builds it) (project)
argument-hint: <feature-number-or-name>
---

Implement a feature from the backlog.

## Instructions

1. Find the feature file matching `$ARGUMENTS` in `features/backlog/`
   - Match by number (e.g., "005") or partial name
2. If multiple matches, list them and ask which one
3. If no matches, list available features in backlog
4. Move the file to `features/in-progress/`
5. Show confirmation with the feature summary
6. Read the feature file thoroughly
7. Follow the implementation steps in the feature file
8. Check off each step as you complete it `[x]`
9. Run any tests specified in the Testing section
10. When done, ask if the user wants to mark it complete with `/feature-done`

## Rules

- Only one feature should be in-progress at a time (warn if there's already one)
- Follow the feature file exactly - don't add unrequested changes
- Update the feature file checkboxes as you progress
- If you encounter blockers, document them in the feature file
