# Pitfalls Research

**Domain:** Offline-first habit + task tracking
**Researched:** 2026-03-19
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Day Boundary Drift

**What goes wrong:**
Streaks and completion indicators shift by one day for users near timezone boundaries.

**Why it happens:**
UTC date serialization is used for local-day UX rules.

**How to avoid:**
Use local date format/parse helpers for all day-based operations.

**Warning signs:**
User reports "completed today but app shows yesterday."

**Phase to address:**
Phase 1

---

### Pitfall 2: Fragile Import Paths

**What goes wrong:**
Malformed or oversized backup files crash import flow or poison local state.

**Why it happens:**
File content and shape are trusted too early.

**How to avoid:**
Enforce file-size caps, parse guards, and strict normalization before store writes.

**Warning signs:**
Import alerts without actionable messages, empty/broken list rendering after import.

**Phase to address:**
Phase 1

---

### Pitfall 3: Gesture Conflict Between Parent Pager and Nested Horizontal Views

**What goes wrong:**
Nested calendar swipe is captured by page-level swipe.

**Why it happens:**
No gesture ownership strategy between parent and child horizontal surfaces.

**How to avoid:**
Temporarily lock parent swipe when nested interaction context is active.

**Warning signs:**
User cannot swipe calendar but can swipe full page.

**Phase to address:**
Phase 2

---

### Pitfall 4: Duplicate Submissions in Modal Forms

**What goes wrong:**
Rapid taps create duplicate habits/tasks before modal fully closes.

**Why it happens:**
No submission lock or temporary disabled state during transition.

**How to avoid:**
Track `isSubmitting` state and disable action button during close window.

**Warning signs:**
Back-to-back duplicate records with near-identical timestamps.

**Phase to address:**
Phase 1

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline date logic in multiple files | Quick implementation | Drift and inconsistent behavior | Only as temporary patch with follow-up ticket |
| Skipping import schema checks | Less code | Corrupt state and hard-to-debug failures | Never |
| Adding features before requirement traceability | Faster starts | Scope drift and missing validation | Never for milestone work |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| File picker import | Assume selected file is valid JSON | Parse in guarded block with user-facing error |
| Share/export | Assume share target always available | Check availability and provide fallback |
| Notifications (future) | Schedule without permission handling | Gate by permission with clear fallback |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-item expensive recomputation | Stutter while scrolling | Memoize and derive shared state at parent level | 100+ items |
| Unbounded text in list rows | Layout jitter / clipping | Apply truncation and flexible sizing | Long localized strings |
| Excessive offscreen retention | Memory pressure on low-end devices | Tune pager/list window settings | Mid/low-tier devices |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trust imported file content | Local data corruption | Normalize/validate every imported field |
| Silent import failure | User assumes data restored | Explicit failure status + alert details |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Generic error messages ("Import failed") | No recovery path | Include reason and next action |
| Missing disabled/loading form states | Confusing repeated actions | Show action-specific loading state |

## "Looks Done But Isn't" Checklist

- [ ] **Import flow:** Handles malformed JSON with readable message
- [ ] **Streak logic:** Correct around local midnight and timezone shifts
- [ ] **Calendar gestures:** Nested swipe works while page swipe remains available outside modal context
- [ ] **Modal forms:** Rapid taps cannot create duplicates

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Date boundary drift | MEDIUM | Migrate date helpers and recompute derived fields |
| Broken import | LOW | Reset to previous backup and retry with validated file |
| Gesture conflict | LOW | Add parent-lock signal during child gesture contexts |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Day boundary drift | Phase 1 | Local date tests + manual midnight scenario checks |
| Fragile import paths | Phase 1 | Malformed/oversized file test cases |
| Pager/calendar conflict | Phase 2 | Manual gesture matrix in sheet + pager contexts |
| Duplicate submissions | Phase 1 | Rapid tap simulation on create actions |

## Sources

- Existing Forge code behavior and issue patterns
- Common failure modes in offline mobile trackers

---
*Pitfalls research for: Forge Mobile*
*Researched: 2026-03-19*
