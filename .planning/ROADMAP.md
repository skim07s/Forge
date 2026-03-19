# Roadmap: Forge Mobile

## Overview

This roadmap stabilizes Forge Mobile for reliable daily use first, then adds high-value reminder and insight capabilities, and finally closes with a release-quality hardening gate. The sequence minimizes regression risk by tackling foundational reliability before feature expansion.

## Phases

- [ ] **Phase 1: Reliability Foundation** - Normalize date/data boundaries and prevent corruption paths.
- [ ] **Phase 2: Interaction Stability** - Resolve gesture and input race conditions across nested UI surfaces.
- [ ] **Phase 3: Reminder Engine** - Add local reminder scheduling with permission-safe UX.
- [ ] **Phase 4: Insights + Accessibility** - Deliver progress visibility with resilient text/locale handling.
- [ ] **Phase 5: Release Readiness** - Verify edge-case matrix and finalize quality gates.

## Phase Details

### Phase 1: Reliability Foundation
**Goal**: Ensure core tracking data remains correct and recoverable under real-world edge cases.
**Depends on**: Nothing (first phase)
**Requirements**: RELY-01, RELY-02, RELY-03, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Habit date/streak behavior is correct across local day boundaries.
  2. Import flow rejects malformed/oversized files with actionable messages.
  3. Rapid creation/toggle interactions cannot create duplicate records.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Unify local date formatting/parsing across stores and transfer utilities.
- [ ] 01-02: Harden import normalization, schema checks, and failure messaging.
- [ ] 01-03: Add interaction-level duplicate-action protections and targeted tests.

### Phase 2: Interaction Stability
**Goal**: Ensure complex nested gestures and modal interactions remain predictable.
**Depends on**: Phase 1
**Requirements**: RELY-04
**Success Criteria** (what must be TRUE):
  1. Nested calendar swipe works consistently inside sheets.
  2. Parent page swipe does not block child interaction contexts.
  3. Gesture behavior is documented in a regression matrix.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Implement robust pager-lock ownership strategy for nested horizontal gestures.
- [ ] 02-02: Add interaction regression checks across Android and iOS flows.

### Phase 3: Reminder Engine
**Goal**: Introduce practical reminder functionality without backend dependencies.
**Depends on**: Phase 2
**Requirements**: REM-01, REM-02, REM-03
**Success Criteria** (what must be TRUE):
  1. User can configure reminder state per habit.
  2. Reminders are delivered locally at configured times.
  3. Permission-denied state is clear and non-blocking.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Define reminder data model and store actions.
- [ ] 03-02: Integrate local notification scheduling and cancellation.
- [ ] 03-03: Build permission fallback UX and recovery prompts.

### Phase 4: Insights + Accessibility
**Goal**: Improve product value and resilience for diverse users and locales.
**Depends on**: Phase 3
**Requirements**: INS-01, INS-02, INS-03, A11Y-01, A11Y-02, A11Y-03
**Success Criteria** (what must be TRUE):
  1. Weekly and per-habit insights are visible and performant.
  2. Accessibility labels/roles are complete on core actions.
  3. Long text and localized date strings render without layout breakage.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Implement lightweight insight surfaces for weekly and per-habit summaries.
- [ ] 04-02: Complete a11y semantics pass on primary flows.
- [ ] 04-03: Validate overflow and localization behavior in key screens.

### Phase 5: Release Readiness
**Goal**: Ship with confidence through explicit quality gates and edge-case verification.
**Depends on**: Phase 4
**Requirements**: QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. Regression scenarios are documented and reproducible.
  2. Edge-case checklist passes for timezone, import, gesture, and rapid-action scenarios.
  3. Final build artifacts are generated without blocking issues.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Create and execute regression scenario matrix for core flows.
- [ ] 05-02: Run release checklist and produce final verification summary.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Reliability Foundation | 0/3 | Not started | - |
| 2. Interaction Stability | 0/2 | Not started | - |
| 3. Reminder Engine | 0/3 | Not started | - |
| 4. Insights + Accessibility | 0/3 | Not started | - |
| 5. Release Readiness | 0/2 | Not started | - |
