# 02. Architecture and Runtime

## Current runtime

Teacher OS is a GitHub Pages web application. The public `index.html` loads a base HTML document and injects multiple historical CSS/JS layers through v0.32.

This layered strategy accelerated development but is now technical debt.

## Current major components

- HTML/CSS/JavaScript front end
- localStorage for primary structured app state and preferences
- IndexedDB for recovery snapshots and optional local raw-source retention
- GitHub Pages for static deployment
- GitHub Actions for regression tests, deployment, diagnostics and quality guards
- CDN/browser libraries for document parsing/OCR where required
- Comcigan integration/configuration for timetable freshness

## Architectural problem to solve before 1.0

Historical versions wrap or extend globals such as `render`, `switchView`, import handlers and storage functions. This can cause:

- difficult execution-order reasoning
- duplicate DOM work
- CSS cascade conflicts
- regressions hidden by later layers
- higher load cost
- harder maintenance for a new developer/AI

Do not continue solving architecture problems by adding one more compatibility layer indefinitely.

## v1-consolidation target

Move gradually toward a stable modular runtime without breaking existing browser data.

Recommended order:

1. Freeze current runtime order and regression behavior.
2. Create a repeatable build/concatenation baseline that preserves behavior.
3. Inventory global functions, event handlers and storage keys.
4. Remove duplicate utilities and redundant wrappers.
5. Introduce explicit services/modules for state, storage, documents, timetable, teaching, students, projects and UI.
6. Centralize render/event orchestration.
7. Optimize startup and lazy-load expensive document/OCR functions.
8. Only after parity and migration tests, replace the public layered loader.

## Desired module boundaries

Illustrative target, not a mandatory directory structure:

```text
src/
  core/
    state
    storage
    migrations
    events
    confidence
  documents/
    classify
    extract
    hwp-hwpx
    pdf
    spreadsheet
    ocr
    versions
    retention
  teaching/
    timetable
    comcigan
    progress
    lesson-context
    assessment
  students/
    evidence
    drafts
    record-quality
    neis-bytes
  work/
    calendar
    projects
    work-library
    clubs
  desk/
    today
    search
    contacts
    message-tools
  recovery/
    snapshots
    undo
  ui/
    navigation
    components
    mobile
```

## Runtime rules

- No module should silently convert unavailable data to zero/empty confirmed data.
- Heavy OCR/document code should not block initial Teacher Desk rendering when avoidable.
- Independent data loads may run in parallel when this does not lower correctness.
- UI should render useful confirmed information first and label pending/unverified sources.
- A failed storage snapshot must fail closed before destructive replacement.

## Desktop companion decision

Do not build a desktop companion as a prerequisite for 1.0.

Consider later only if recurring real-world needs emerge that browsers cannot solve well, such as:

- watched school folders
- background local backup
- automatic HWP preprocessing
- system tray/OS notifications
- file explorer integration

The web application remains the primary product.
