# 08. Testing and Quality

## Quality hierarchy

1. correctness
2. performance at equal correctness
3. automation/features

A feature is not 'done' because the UI exists. Status reporting must distinguish:

- implemented
- tests passed
- verified in actual environment

## Current CI direction

GitHub Actions currently performs broad regression checks across historical version tests, JavaScript syntax checks, privacy guards, mobile layout guards and GitHub Pages smoke tests.

Always inspect `.github/workflows/` for the exact current set.

## Required regression categories

### Runtime

- JavaScript syntax
- loader/assets present
- no missing dependency layer
- no accidental global override regression

### Data

- existing browser-state compatibility
- localStorage migration
- IndexedDB recovery availability
- save → reload → restore paths

### Timetable / teaching

- live vs basic timetable precedence
- Comcigan mismatch/unconfigured/failed states
- unknown vs confirmed zero
- class-specific progress

### Documents

- classification
- exact duplicate SHA-256 detection
- version-family decisions
- high-confidence auto-apply threshold
- ambiguous review
- older-version rejection
- replacement undo
- source retention level
- failed parse must not become confirmed empty

### Privacy

- no real PII fixtures
- no audio committed
- no raw sensitive document committed
- feedback/report URL sanitization
- public diagnostics sanitized

### Student records

- no-evidence critical failure
- prohibited/unsupported content detection
- byte limits only when officially known for that year
- sensitive-data firewall

### Mobile

- bottom navigation does not get overridden by old 100vh rules
- safe-area behavior
- importer/version review/source-retention UI usable on small screens

### Work packs

- install/recommend
- removal deletes only library-created project
- pre-existing project is unlinked, never destroyed

## Real-world/empirical testing still required

Unit and regression tests cannot substitute for real browser/document behavior.

Priority empirical matrix:

- Windows Chrome
- Windows Edge
- Android Chrome
- iPhone/iPad Safari when available
- low-spec school PC if possible

Document matrix:

- clean HWP/HWPX table
- merged-cell HWPX
- native-text PDF
- scanned PDF
- low-resolution image
- multi-sheet Excel
- CSV
- DOCX/PPTX
- modified document versions

## Document benchmark metrics

At minimum record:

- classification precision
- classification recall
- field precision
- field recall
- auto-apply false-positive rate
- processing latency
- OCR fallback rate
- version-decision accuracy

Prefer a small measured benchmark over unsupported qualitative claims.

## Release gating for 1.0

Do not replace the public layered runtime until:

- core feature parity passes
- existing stored data remains readable
- migration/rollback is tested
- mobile regressions are absent
- privacy guards pass
- document version/undo still works
- Pages live assets are verified
- consolidated runtime is clearly simpler and no slower at equal correctness
