---
description: Plan a new feature (creates file in features/backlog/)
argument-hint: <feature-name> [description]
---

Create a new feature file for planning.

## Instructions

1. Find the next available feature number by checking existing files in `features/backlog/`, `features/in-progress/`, and `features/done/`
2. Create a new feature file at `features/backlog/NNN-$ARGUMENTS.md` using the template from `features/_template.md`
3. Fill in the template based on what the user wants to implement
4. If the description is vague, ask clarifying questions before writing
5. Show the user the created file path when done

## Context

- Template location: `features/_template.md`
- Naming format: `NNN-lowercase-hyphen-name.md`
- The feature file should be thorough enough to implement later without additional context
