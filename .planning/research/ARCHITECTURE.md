# Architecture Research

**Domain:** Offline-first mobile habit + task app
**Researched:** 2026-03-19
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Home Pager  Anvil Screen  Ingot Screen  Settings Screen    │
│       │            │             │              │            │
├───────┴────────────┴─────────────┴──────────────┴───────────┤
│                     Interaction Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Sheets / Gestures / Calendar / Form Validation              │
├─────────────────────────────────────────────────────────────┤
│                       State Layer                             │
│      Habit Store (Zustand)   Ingot Store (Zustand)          │
├─────────────────────────────────────────────────────────────┤
│                  Persistence / Transfer Layer                 │
│      AsyncStorage   JSON Import/Export Utilities            │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Pages (`src/pages`) | Orchestrate feature flows | Screen-level composition + store selectors |
| Components (`src/components`) | Reusable UI primitives/sections | Controlled props + memoization where needed |
| Stores (`src/context`) | Canonical domain state | Zustand actions with persisted storage |
| Utilities (`src/utils`) | Cross-cutting helpers | Import/export normalization, haptics, date helpers |

## Recommended Project Structure

```text
src/
├── pages/          # Screen routes and top-level flows
├── components/     # Reusable UI pieces and feature widgets
├── context/        # Zustand stores and domain utilities
└── utils/          # Shared helpers (transfer, haptics, formatters)
```

### Structure Rationale

- **pages/** keeps navigation/state orchestration close to UX flow.
- **components/** isolates reusable UI and limits screen complexity.
- **context/** keeps domain mutations centralized and testable.
- **utils/** holds pure helpers to reduce duplicated logic.

## Architectural Patterns

### Pattern 1: Store-Driven UI
**What:** UI reads from/store actions via selectors.
**When to use:** Screen and list rendering logic.
**Trade-offs:** Simple mental model, but requires disciplined action design.

### Pattern 2: Local-First Persistence
**What:** Persist state to device storage and recover quickly.
**When to use:** Daily tracking workflows where offline use matters.
**Trade-offs:** Great resilience; sync complexity deferred to later milestones.

### Pattern 3: Defensive Data Boundary
**What:** Normalize imported payloads before state mutation.
**When to use:** JSON import/export and migration paths.
**Trade-offs:** Extra code upfront, major reduction in runtime corruption risk.

## Data Flow

### Request Flow

```text
User action -> Component handler -> Zustand action -> Persisted state
                                        |
                                    Derived fields
```

### State Management

```text
Store state <-> actions/mutations <-> subscribed components
```

### Key Data Flows

1. **Habit completion:** tap -> toggle action -> completedDates/streak recompute -> UI refresh.
2. **Backup restore:** file pick -> parse/normalize -> setHabits/setIngots -> status feedback.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user / offline | Current architecture is sufficient |
| Power users with large history | Add pagination/window tuning and optional archived history slices |
| Multi-device sync | Introduce sync queue + conflict resolution boundary |

### Scaling Priorities

1. **First bottleneck:** date and normalization edge cases under heavy history.
2. **Second bottleneck:** UI responsiveness with dense lists/calendars.

## Anti-Patterns

### Anti-Pattern 1: UTC-only local day logic
**What people do:** use `toISOString().split("T")[0]` for user-facing local dates.
**Why it's wrong:** off-by-one day errors around midnight/timezone boundaries.
**Do this instead:** local date formatters/parsers for day-based features.

### Anti-Pattern 2: Unsanitized imported payloads
**What people do:** trust imported JSON shape.
**Why it's wrong:** malformed data can crash views or corrupt persistence.
**Do this instead:** validate/sanitize before store writes.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| File picker/share | Thin adapter in Settings flow | Guard file size and parse failures |
| Notifications (future) | Permission + schedule adapter | Needs fallback when permission denied |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Pages <-> Stores | Direct action calls | Keep mutations in stores |
| Settings <-> Transfer utils | Pure function boundaries | Easier testing and migration support |

## Sources

- Existing Forge codebase architecture and dependency graph
- Established patterns for React Native offline apps

---
*Architecture research for: Forge Mobile*
*Researched: 2026-03-19*
