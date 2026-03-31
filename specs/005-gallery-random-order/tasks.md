# Tasks: Gallery Random Order Option

**Input**: Design documents from `/specs/005-gallery-random-order/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests (manual browser testing per project convention)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web frontend**: `web/src/`, `web/public/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add utility function and configuration schema

- [ ] T001 [P] Add `sortById()` helper function to `web/src/lib/utils/shuffle.js`
- [ ] T002 [P] Add `galleries.randomOrder: true` global default to `web/public/site.json`

**Checkpoint**: Configuration and utility ready for component updates

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Compute `randomOrder` in root component for prop drilling

**⚠️ CRITICAL**: Components cannot receive `randomOrder` prop until this is complete

- [ ] T003 Add `$derived` expression to compute effective `randomOrder` for current gallery in `web/src/App.svelte`

**Checkpoint**: `randomOrder` value available for passing to child components

---

## Phase 3: User Story 1 - Gallery Alphabetical Display (Priority: P1) 🎯 MVP

**Goal**: When `randomOrder: false`, gallery images display sorted alphabetically by `image.id`

**Independent Test**: Set `randomOrder: false` in site.json, verify images appear in alphabetical order on page load

### Implementation for User Story 1

- [ ] T004 [US1] Add `randomOrder` prop to component declaration in `web/src/lib/components/Gallery.svelte`
- [ ] T005 [US1] Import `sortById` from shuffle.js in `web/src/lib/components/Gallery.svelte`
- [ ] T006 [US1] Modify `reshuffle()` function to use `sortById()` when `randomOrder: false` in `web/src/lib/components/Gallery.svelte`
- [ ] T007 [US1] Pass `randomOrder` prop from App.svelte to Gallery component in `web/src/App.svelte`

**Checkpoint**: Gallery displays alphabetically when `randomOrder: false`

---

## Phase 4: User Story 2 - Lightbox Sequential Navigation (Priority: P2)

**Goal**: When `randomOrder: false`, lightbox navigation follows alphabetical sequence starting at clicked image

**Independent Test**: Click an image with `randomOrder: false`, use arrow keys to verify sequential navigation

### Implementation for User Story 2

- [ ] T008 [US2] Add `randomOrder` prop to component declaration in `web/src/lib/components/Lightbox.svelte`
- [ ] T009 [US2] Modify `generateSequence()` to sort and set `currentIndex` to clicked image position when `randomOrder: false` in `web/src/lib/components/Lightbox.svelte`
- [ ] T010 [US2] Pass `randomOrder` prop from App.svelte to Lightbox component in `web/src/App.svelte`

**Checkpoint**: Lightbox navigation is sequential when `randomOrder: false`

---

## Phase 5: User Story 3 - Header Reshuffle Disabled (Priority: P3)

**Goal**: When `randomOrder: false`, clicking the header logo does nothing (reshuffle disabled)

**Independent Test**: Set `randomOrder: false`, click header logo, verify no reshuffle occurs

### Implementation for User Story 3

- [ ] T011 [US3] Modify Header.svelte to accept optional `onLogoClick` prop (null disables) in `web/src/lib/components/Header.svelte`
- [ ] T012 [US3] Update logo button to conditionally call `onLogoClick` only when defined in `web/src/lib/components/Header.svelte`
- [ ] T013 [US3] Pass `onLogoClick` as `null` when `randomOrder: false` in `web/src/App.svelte`

**Checkpoint**: Header click disabled when `randomOrder: false`

---

## Phase 6: User Story 4 - Per-Gallery Override (Priority: P4)

**Goal**: Per-gallery `randomOrder` setting overrides global default

**Independent Test**: Set global `randomOrder: true`, set one gallery to `randomOrder: false`, verify each gallery respects its setting

### Implementation for User Story 4

- [ ] T014 [US4] Add per-gallery `randomOrder` override to one gallery in `web/public/site.json`
- [ ] T015 [US4] Verify `$derived` expression in App.svelte correctly resolves per-gallery override (already implemented in T003)

**Checkpoint**: Per-gallery override works correctly

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T016 Run full manual test suite from quickstart.md
- [ ] T017 Verify backward compatibility (default `randomOrder: true` behaves like current implementation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (needs config property to exist)
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Gallery)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (Lightbox)**: Can start after Foundational - Independent of US1
- **User Story 3 (Header)**: Can start after Foundational - Independent of US1, US2
- **User Story 4 (Per-Gallery)**: Depends on US1-US3 being complete for meaningful testing

### Within Each User Story

- Add prop to component first
- Implement logic second
- Wire up in App.svelte last

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- After T003, all of US1, US2, US3 can be worked on in parallel (different components)
- Models within a story marked [P] can run in parallel

---

## Parallel Example: After Foundational Complete

```bash
# All user stories can start in parallel after Phase 2:
# Developer A: User Story 1 (Gallery.svelte)
# Developer B: User Story 2 (Lightbox.svelte)
# Developer C: User Story 3 (Header.svelte)

# Or single developer, parallel within Setup:
Task: "T001 [P] Add sortById() to shuffle.js"
Task: "T002 [P] Add randomOrder to site.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: User Story 1 (T004-T007)
4. **STOP and VALIDATE**: Test gallery alphabetical display
5. Proceed to remaining stories

### Incremental Delivery

1. Setup + Foundational → Configuration ready
2. Add User Story 1 → Gallery sorting works → **MVP!**
3. Add User Story 2 → Lightbox sequential navigation
4. Add User Story 3 → Header click disabled
5. Add User Story 4 → Per-gallery overrides verified
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable via manual browser testing
- No automated tests per project convention (manual testing only)
- Commit after each phase for clean history
- Default value `true` ensures backward compatibility
