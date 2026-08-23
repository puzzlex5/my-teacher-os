# 10. Known Issues and Technical Debt

This file lists important known limitations. Do not assume every item is still present; verify against the latest code before fixing.

## Architecture

### Historical runtime layering

The public app still loads many historical JS/CSS layers. This is the largest structural debt and the reason for `v1-consolidation`.

Risk:

- wrapper conflicts
- slower startup
- duplicate render/event work
- difficult debugging
- CSS cascade regressions

## Document intelligence

### HWP/HWPX structure

Current extraction is not yet sufficiently strong for all structured tables/merged cells.

Priority:

- preserve row/cell relationships
- merged cells
- assessment/work-assignment/timetable tables

### PDF positional extraction

Native text extraction exists, but positional/table reconstruction still needs improvement.

### OCR empirical coverage

Browser/mobile PaddleOCR and fallback behavior are not fully validated across all target devices and school-style images.

### Classifier calibration

Current classification is heuristic. Add measured per-class thresholds/confusion analysis before claiming trained learning behavior.

### Real mixed-file benchmark

Need 10-20+ synthetic/public/anonymized school-style documents and measured precision/recall/latency.

## Comcigan

Local user configuration is supported, but true independent multi-teacher scheduled synchronization without login is not solved.

A server collector using one shared config must not be described as real multi-user sync.

## Cross-device data

Browser-local storage means data is not automatically shared between devices. Account-based secure sync/backup remains unresolved.

## Student workflows

### Semantic grounding

Current evidence quality checks are largely deterministic/lexical. Stronger semantic evidence-to-claim validation remains future work.

### Draft version diff / quick memo

Useful but not yet core-complete.

## Feedback

Tester feedback can be stored/shared locally, but a safe central private feedback backend without login is unresolved.

## Lesson audio

Browser speech recognition and Wake Lock behavior may vary. Background/screen-off reliability is not guaranteed. Real audio format testing is incomplete.

## Teacher Desk

School-specific bell times may need stronger configuration. Default middle/high bell times must remain visibly approximate unless confirmed.

## Message tools

Current local message digest/cleanup is intentionally conservative. Better semantics are desirable but must not hallucinate missing information.

## Privacy audit

Continue auditing whether sensitive content can leak through:

- feedback reports
- diagnostic logs
- import metadata
- search indexes
- JSON backups
- GitHub issue URLs

## Source retention

Raw originals are not persisted by default. However in-memory extracted text may remain transiently while the current page/batch exists. Do not promise immediate memory scrubbing unless implemented and verified.

## Work library removal

A previous bug left library-created projects after work-pack removal. Main has been fixed so only projects created by `Teacher OS 업무 라이브러리` are deleted; pre-existing projects are unlinked. Ensure consolidation preserves this behavior.

## Migration rule

Do not 'fix' a known issue by introducing a higher-risk data-loss or privacy problem. Prefer conservative, testable increments.
