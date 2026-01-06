---
description: Plan and design a new feature before creating the feature document
argument-hint: <feature-idea>
---

Help the user think through and design a new feature before formalizing it.

## Instructions

1. **Enter plan mode** - This is a planning/discussion phase, not implementation
2. **Understand the idea** - Ask clarifying questions about:
   - What problem does this solve?
   - What's the expected user experience?
   - Any constraints or preferences?
3. **Explore the codebase** - Look at relevant files to understand:
   - Current implementation
   - Patterns used in similar features
   - Files that would need changes
4. **Propose approaches** - If multiple solutions exist:
   - Present options with trade-offs
   - Recommend one with reasoning
   - Let the user choose
5. **Summarize the plan** - Once agreed, provide a clear summary of:
   - The approach chosen
   - Files to modify
   - Implementation steps
6. **Prompt for next step** - Ask: "Ready to create the feature document? Run `/feature-create <name> <description>`"

## Guidelines

- Keep discussion focused and concise
- Use the project's existing patterns (check `docs/` for conventions)
- Consider Svelte 5 runes patterns for frontend changes
- Don't write code yet - this is planning only
- The goal is a clear plan that can be documented with `/feature`

## Context

The user's feature idea: $ARGUMENTS
