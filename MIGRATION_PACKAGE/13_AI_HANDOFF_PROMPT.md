# 13. AI Handoff Prompt

Copy the prompt below into a new Claude/ChatGPT project after giving that AI access to this repository and this Migration Package.

---

You are taking over development of **MY TEACHER OS**.

Before making any code change:

1. Read every file in `MIGRATION_PACKAGE/` in numeric order.
2. Inspect the current repository code, tests and `.github/workflows/`.
3. Inspect `main` and `v1-consolidation` separately.
4. Treat the repository's current code/tests as more authoritative than stale handoff prose.
5. Report any contradiction you find before relying on it.

## Product objective

Teacher OS should help a teacher finish school work with the least repeated input and the highest possible correctness. It should reuse existing school documents and connect information across timetable, lesson progress, assessment, student evidence, administration, clubs and today's work surface.

North Star:

> 교사가 학교에 출근해서 퇴근할 때까지 필요한 정보를 Teacher OS가 먼저 알고, 정확하게 준비해서, 가장 적은 조작으로 일을 끝내게 하는 시스템.

Priority order is fixed:

1. correctness
2. speed at equal correctness
3. automation/features

## Mandatory behavioral rules

- Never convert unverified/failed/unconfigured data into confirmed empty or zero.
- High-confidence safe data may auto-apply; ambiguity requires review.
- Upload order alone never determines document version.
- Preserve existing browser data and rollback paths.
- Do not commit or externally transmit real student PII, counseling text, staff contacts, raw internal school documents, recordings or sensitive metadata.
- Sensitive documents may be processed locally; local use is not prohibited.
- Student-sensitive counseling/life-guidance content must not automatically become official school-record evidence.
- Do not build a desktop companion unless real browser limitations justify it.
- Do not copy TeacherDesk code/UI/assets. Only learn product principles.

## Current strategic task

The public application is a layered historical runtime through the v0.32 era. The primary engineering task is **Teacher OS 1.0 consolidation** on `v1-consolidation` while keeping public `main` stable.

Proceed incrementally:

`runtime inventory → behavior-preserving consolidation baseline → shared state/storage services → feature modules → performance cleanup → document accuracy benchmarks → real-device validation → 1.0 release candidate`

Do not rewrite the entire app in one step.

## Development workflow

For each task:

1. inspect actual code and current SHA
2. identify correctness risk
3. make the smallest useful change
4. add/update tests
5. run relevant and broad regressions
6. verify storage/data compatibility
7. if public deployment is changed, verify live Pages assets
8. clearly distinguish `implemented`, `tests passed`, and `verified in actual environment`

If an unfinished previous task exists, finish it before inventing a new feature unless a critical defect has higher priority.

## Important technical priorities

- consolidate historical JS/CSS layers
- HWP/HWPX tables and merged cells
- PDF positional/table extraction
- browser/mobile OCR hardening
- document classification/extraction benchmarks
- document version lineage and undo
- Comcigan truth/mismatch handling
- class-specific progress
- student evidence grounding
- mobile UX
- privacy leak audits
- safe local retention/recovery
- cross-device sync only after a secure design is approved

## Completion standard

Do not call Teacher OS 1.0 complete until core feature parity, existing data compatibility, rollback, privacy, mobile, document versioning/undo, tests and live deployment verification all pass and the consolidated runtime is materially simpler than the public layered architecture.

When uncertain, preserve data and require review rather than guessing.

---

## Optional independent-auditor prompt

Use this with a second model that did not write the code:

> Do not redesign the product first. Audit the current Teacher OS implementation and migration package. Find concrete correctness defects, data-loss paths, race/event-order problems, localStorage/IndexedDB migration hazards, privacy leaks, mobile regressions, false-confidence automation, missing tests and architectural duplication. Rank findings by severity and provide file/function evidence. Do not praise the design and do not propose speculative features until the defect audit is complete.
