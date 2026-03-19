# Requirements: Forge Mobile

**Defined:** 2026-03-19
**Core Value:** Users can reliably track daily commitments and recover their data without fear of loss.

## v1 Requirements

### Reliability

- [ ] **RELY-01**: User habit completion and streak logic use local-day rules (no UTC boundary drift).
- [ ] **RELY-02**: User can perform rapid create/toggle actions without duplicate records.
- [ ] **RELY-03**: App remains responsive while rendering long lists and calendar-heavy views.
- [ ] **RELY-04**: User can swipe nested calendar views without page-level gesture conflicts.

### Data Transfer

- [ ] **DATA-01**: User import rejects malformed JSON with clear recovery guidance.
- [ ] **DATA-02**: User import rejects oversized files with explicit size feedback.

### Reminders

- [ ] **REM-01**: User can enable or disable reminders per habit.
- [ ] **REM-02**: User receives local notifications at configured reminder times.
- [ ] **REM-03**: App handles notification permission denied state with clear fallback messaging.

### Insights

- [ ] **INS-01**: User can view weekly completion trend for habits.
- [ ] **INS-02**: User can view per-habit streak and completion totals in detail view.
- [ ] **INS-03**: User can view simple completion rate summaries without noticeable performance lag.

### Accessibility & Localization

- [ ] **A11Y-01**: Interactive controls expose accessible roles/labels for screen readers.
- [ ] **A11Y-02**: Long translated text and long user-entered titles do not break layout.
- [ ] **A11Y-03**: User-visible date labels respect device locale formatting.

### Quality Gates

- [ ] **QUAL-01**: Core flows (habit add/toggle, ingot add/toggle, import/export) have documented regression test scenarios.
- [ ] **QUAL-02**: Release candidate passes edge-case checklist (timezone, malformed import, rapid taps, gesture matrix).

## v2 Requirements

### Sync and Accounts

- **SYNC-01**: User can sync habits and ingots across devices.
- **SYNC-02**: User can restore history after reinstall via account login.

### Advanced Product Surface

- **SOC-01**: User can optionally share progress snapshots.
- **COACH-01**: User can receive adaptive suggestions based on completion trends.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mandatory account onboarding | Conflicts with current low-friction local-first strategy |
| Real-time collaboration/social feed | Not part of core solo tracking value |
| Web desktop parity in this milestone | Mobile reliability is current priority |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RELY-01 | Phase 1 | Pending |
| RELY-02 | Phase 1 | Pending |
| RELY-03 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| RELY-04 | Phase 2 | Pending |
| REM-01 | Phase 3 | Pending |
| REM-02 | Phase 3 | Pending |
| REM-03 | Phase 3 | Pending |
| INS-01 | Phase 4 | Pending |
| INS-02 | Phase 4 | Pending |
| INS-03 | Phase 4 | Pending |
| A11Y-01 | Phase 4 | Pending |
| A11Y-02 | Phase 4 | Pending |
| A11Y-03 | Phase 4 | Pending |
| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
