# Forge Mobile

## What This Is

Forge Mobile is an offline-first React Native habit and task tracker focused on daily consistency. Users track repeat habits in The Anvil, track one-off tasks in the Ingot List, and keep progress safe with JSON import/export backups.

## Core Value

Users can reliably track daily commitments and recover their data without fear of loss.

## Requirements

### Validated

- ✓ Users can create, complete, and review habits with streak tracking — existing
- ✓ Users can manage one-off tasks in a dedicated list — existing
- ✓ Users can export and import local data as JSON — existing
- ✓ User data persists across app restarts using local storage — existing

### Active

- [ ] Add reminder scheduling for habits with safe defaults
- [ ] Improve reliability for edge cases (timezone, malformed import, rapid taps)
- [ ] Add richer progress insights without harming app responsiveness
- [ ] Improve accessibility and localization readiness across key screens

### Out of Scope

- Cloud sync and account system — requires backend scope not planned for this milestone
- Social/community features — not aligned with core solo-tracking value
- Desktop/web-first redesign — current priority is native mobile quality

## Context

- Existing stack: Expo SDK 54, React Native 0.81, Zustand stores, AsyncStorage persistence.
- UX is centered around three sections: Anvil, Ingot List, and Settings.
- Team priority is shipping stable quality improvements over broad new feature surface.
- Current environment already has active code and dependencies; planning should preserve existing architecture style.

## Constraints

- **Offline-first**: Core tracking and history must work without network — reliability in daily use
- **No backend dependency**: Features should not require server infrastructure — keep scope and ops cost low
- **Performance**: List interactions must remain smooth on mid-range devices — primary user touchpoint
- **Backward compatibility**: Existing stored/imported data must remain readable — avoid data loss regressions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep local-first architecture for current milestone | Fastest route to reliability and user trust | — Pending |
| Prioritize hardening and reminders before major new surfaces | Improves daily retention and lowers churn risk | — Pending |
| Keep phased roadmap with explicit requirement traceability | Prevents scope drift and missed requirements | — Pending |

---
*Last updated: 2026-03-19 after project initialization*
