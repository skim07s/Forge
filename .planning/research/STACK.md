# Stack Research

**Domain:** Offline-first mobile habit and task tracking
**Researched:** 2026-03-19
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo / React Native | Expo 54 / RN 0.81 | Cross-platform mobile runtime | Existing codebase already runs here; fastest path for incremental delivery |
| Zustand + AsyncStorage | Zustand 5 / AsyncStorage 2.2 | Local state and persistence | Lightweight, predictable, works well for offline-first local data |
| React Native Reanimated + Gesture Handler | Reanimated 4 / RNGH 2.28 | High-quality motion and gestures | Already integrated and suitable for smooth sheet/calendar interactions |
| PagerView + FlatList | PagerView 6.9 / RN core list | Screen paging and large list rendering | Efficient primitives for current UI composition |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @expo-google-fonts/inter | 0.4.x | Typography consistency | Use scoped weights only to avoid asset bloat |
| expo-document-picker + expo-file-system + expo-sharing | 14/19/14 | Import/export and sharing backups | Data portability and user trust workflows |
| lucide-react-native | 0.562.x | Iconography | Maintain consistent icon system across tabs/actions |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Expo export/build tooling | Bundling validation | Use export checks for pre-merge confidence |
| Git + atomic doc commits | Planning traceability | Keep planning artifacts versioned per milestone |

## Installation

```bash
npm install
npx expo start
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zustand local store | Redux Toolkit | If cross-team conventions or advanced devtools mandates Redux |
| Expo managed workflow | Bare RN | If native modules exceed Expo capabilities |
| JSON backup import/export | Cloud sync backend | When multi-device sync becomes a validated requirement |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Early backend coupling for core tracking | Adds latency and operational risk before value validation | Keep local-first until sync is validated |
| Heavy global architecture rewrites | Slows delivery and introduces regressions | Incremental hardening in existing structure |

## Stack Patterns by Variant

**If reminders remain local-only:**
- Use Expo notifications and persisted schedule metadata
- Because it keeps dependency surface small and works offline

**If cloud sync is introduced later:**
- Add API client boundary and sync queue module
- Because existing local model can evolve into source-of-truth + sync reconciliation

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| expo@54 | react-native@0.81 | Current stable pairing in codebase |
| reanimated@4.1 | gesture-handler@2.28 | Existing gesture/animation pair in app |

## Sources

- Existing Forge codebase and lockfile — current dependency truth
- Expo and React Native official docs — verify versions during implementation

---
*Stack research for: Forge Mobile*
*Researched: 2026-03-19*
