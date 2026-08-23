# Teacher OS 1.0 Consolidation

## Goal
Preserve every verified Teacher OS behavior while replacing the layered v05→v32 runtime with a maintainable 1.0 architecture.

## Non-negotiable priorities
1. Accuracy
2. Speed
3. Automation scope / feature count

No 1.0 change may reduce a verified accuracy guard for convenience or speed.

## Current baseline
The live loader currently composes many historical JS/CSS layers. This was useful for rapid iteration but now increases load overhead, cascade conflicts, accidental wrapper ordering bugs, and maintenance cost.

The live `main` branch remains untouched during consolidation. Work happens on `v1-consolidation` until parity gates pass.

## Phases

### Phase 1 — Runtime baseline and bundling
- Freeze the exact current load order.
- Generate one ordered JS runtime bundle and one ordered CSS bundle without changing behavior.
- Keep current regression tests as the parity baseline.
- Add an asset manifest so missing/reordered legacy layers fail the build.

### Phase 2 — State and lifecycle consolidation
- One canonical state schema and migration layer.
- One render lifecycle instead of chained global render/switchView wrappers.
- One storage service for localStorage / IndexedDB with explicit privacy classes.
- Preserve recovery, Undo, document version lineage, local source retention, and device self-test.

### Phase 3 — Feature modules
Separate stable modules for:
- Today / Teacher Desk
- Timetable / Comcigan / class progress
- Document Intelligence
- Calendar / assessment / admin / clubs
- Student evidence / school-record studio
- Search / contacts / message tools
- Backup / recovery / feedback / diagnostics

### Phase 4 — Document accuracy
- HWP/HWPX structured tables including row/col spans.
- Native PDF positional table extraction.
- OCR browser/mobile hardening and model reuse.
- Document-class confidence calibration and confusion tests.
- Conservative version replacement remains mandatory.

### Phase 5 — Empirical school-style fixtures
Use only synthetic, anonymized, or public non-PII fixtures in the repository.
Measure:
- document classification precision
- field extraction precision
- timetable/calendar/assessment false-positive rate
- duplicate/version lineage accuracy
- processing time

### Phase 6 — 1.0 cutover
Cut over only when:
- all existing regression tests pass
- all privacy guards pass
- live/mobile layout parity passes
- storage self-test remains available
- document import/Undo/version workflows pass
- main user flows are no slower in meaningful interaction time

## Explicitly deferred
A Windows companion app is not required for 1.0. It should only be considered if real use proves that browser limitations create recurring work that cannot be eliminated within the web app.
