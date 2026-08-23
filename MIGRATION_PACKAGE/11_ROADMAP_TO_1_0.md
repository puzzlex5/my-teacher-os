# 11. Roadmap to Teacher OS 1.0

## Phase 1 — Freeze and inventory

Goal: understand the current layered runtime before changing architecture.

- capture exact loader order
- inventory JS/CSS layers
- inventory storage keys and IndexedDB databases
- inventory global function wrappers/events
- inventory current tests and release guards
- record current public behavior and performance baseline

Exit condition: a new AI/developer can explain how the public runtime boots and where state is stored.

## Phase 2 — Behavior-preserving consolidation baseline

Goal: reduce deployment/runtime fragmentation without semantic changes.

- create deterministic runtime build order
- concatenate/bundle where safe
- preserve source-map/debug traceability where practical
- compare output behavior to current loader
- add parity tests

Exit condition: same behavior with simpler loading, no browser-state loss.

## Phase 3 — Shared core services

Unify duplicated logic for:

- state read/write
- migrations
- storage error handling
- rendering/event scheduling
- confidence states
- undo/recovery snapshots

Exit condition: fewer independent wrappers and a single clear state/storage contract.

## Phase 4 — Feature modules

Separate stable domains:

- documents
- timetable/Comcigan
- teaching/progress
- assessment
- students/record quality
- calendar/projects/clubs
- Teacher Desk/search/contacts
- backup/recovery

Exit condition: a module can be changed without requiring another historical version wrapper.

## Phase 5 — Document accuracy program

This is a product-critical track, not optional cleanup.

- HWP/HWPX structured table extraction
- merged cells
- native PDF positional tables
- OCR runtime hardening
- synthetic/public school-style benchmark set
- per-document-class confidence calibration
- field-level document revision diff where possible

Exit condition: measured precision/recall/latency and conservative auto-apply thresholds.

## Phase 6 — Real-device validation

Validate critical flows on available devices:

- Windows Chrome
- Windows Edge
- Android Chrome
- iOS/iPadOS Safari when available

Flows:

- fresh first run
- document import
- IndexedDB vault self-test
- local original store/retrieve/delete
- save/reload
- backup/restore
- version replacement/undo
- mobile navigation

Exit condition: actual-environment status is separately documented from unit-test status.

## Phase 7 — 1.0 release candidate

Requirements:

- core parity with public stable app
- no silent state loss
- migration/rollback tested
- privacy guards green
- mobile core flow green
- document-version/undo green
- loading/runtime structure materially simpler
- no known critical correctness defect
- Pages live-assets verified

## Phase 8 — 1.0 release

Switch public runtime only after Release Candidate gates pass.

After release:

- keep automatic quality/maintenance running
- stop adding compatibility layers as the default development method
- use modular feature releases
- continue document benchmark growth
- continue real teacher feedback loop

## Post-1.0 candidates

Only after core stability:

- secure cross-device sync/backup design
- stronger semantic student-evidence validation
- true per-user Comcigan scheduled sync if feasible
- optional Windows Companion if real browser limitations justify it
- private centralized tester feedback if a safe backend/auth model is approved
