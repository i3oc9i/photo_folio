# Features

Feature-driven development workflow for this project.

## Structure

```
features/
├── README.md          # This file
├── _template.md       # Template for new features
├── backlog/           # Planned features (not started)
├── in-progress/       # Currently being implemented
└── done/              # Completed features
```

## Workflow

Use the slash commands in Claude Code:

```
/feature-plan <idea>          # 1. Discuss & design the feature
/feature-create <name> <desc> # 2. Create document in backlog/
/feature-start <name>         # 3. Move to in-progress/
/feature-implement            # 4. Implement the feature
/feature-done                 # 5. Move to done/
```

### Workflow Steps

1. **Plan** (`/feature-plan`) - Discuss the idea, explore code, agree on approach
2. **Create** (`/feature-create`) - Create the feature document in `backlog/`
3. **Start** (`/feature-start`) - Move to `in-progress/` when beginning work
4. **Implement** (`/feature-implement`) - Build the feature following the plan
5. **Complete** (`/feature-done`) - Move to `done/` when finished

Only have **one feature in-progress at a time** when possible.

### Other Commands

- `/feature-list` - Show current status of all features

## Naming Convention

```
NNN-short-descriptive-name.md

Examples:
001-scrolltopbutton-effect.md
005-add-image-zoom.md
012-refactor-gallery-state.md
```

- **NNN**: Sequential number (keeps order, prevents conflicts)
- **name**: Lowercase, hyphen-separated, descriptive

## Tips

- **Think before coding**: The feature file should be complete before moving to in-progress
- **One at a time**: Avoid multiple in-progress features
- **Update as you go**: Check off implementation steps as you complete them
- **Keep history**: The done/ folder shows what was accomplished and how
