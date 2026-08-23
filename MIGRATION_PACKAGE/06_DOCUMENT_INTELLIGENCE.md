# 06. Document Intelligence

## Goal

Teacher OS should treat existing school documents as structured data sources so teachers do not have to re-enter information.

## Supported input families

Current code has support paths for formats including:

- HWP / HWPX
- PDF
- XLSX / XLS / CSV
- TXT
- DOCX
- PPTX
- ICS
- JPG / JPEG / PNG / WEBP / BMP

Verify actual browser/runtime support before promising a format as empirically validated.

## Classification

Document classes include concepts such as:

- calendar
- timetable
- live timetable
- assessment
- admin/work assignment
- club
- student
- school plan
- unknown/mixed

Classification currently uses deterministic heuristics from filename, extracted text, layout/table cues and local correction feedback. It is not a trained semantic ML classifier.

## Extraction flow

Recommended conceptual flow:

`file → native parser if possible → preserve structure/layout → OCR fallback only when needed → classify → extract candidates → validate → confidence gate → apply/review`

Do not OCR documents unnecessarily if reliable native text/structure exists.

## Confidence and auto-apply

- High-confidence safe structured candidates may be auto-selected/applied.
- Student data should not be auto-applied into official record workflows.
- Low-confidence or conflicting evidence should remain reviewable.
- A parser failure must not be converted to an empty confirmed document.

## Duplicate detection

Use SHA-256 for exact duplicate detection.

Exact same hash means duplicate regardless of filename.

## Document family/version lineage

Current version logic uses signals such as:

- explicit versions: v1, v2, version2, etc.
- Korean revision markers: 수정, 재수정, 개정, 변경, 최종, 확정
- numbered Korean revisions
- embedded dates in filenames
- same family key
- document class

Rules:

- same hash → duplicate
- authoritative explicit newer version → newer
- authoritative explicit older version → older
- same filename but changed hash without stronger evidence → ambiguous
- upload order alone is never authoritative

For ambiguity, show explicit choices such as new-as-latest vs keep-existing.

## Safe replacement

Whole-document automatic replacement should be conservative.

Before replacing derived structured data:

1. store local undo snapshot
2. identify prior sources in the same family
3. remove only derived records from those prior sources
4. mark old import metadata superseded
5. mark new import current
6. apply new selected candidates

If snapshot storage fails, abort replacement.

## HWP/HWPX priority

Flat text is not sufficient for many Korean school documents.

1.0 priority is preserving:

- rows
- cells
- column relationships
- merged cells
- sheet/section context where available

This is especially important for work assignments, assessments and timetables.

## PDF priority

Improve native positional extraction so tables and timetable layouts can be reconstructed before falling back to OCR.

## OCR

Current direction uses browser OCR with Korean support and fallback paths.

Empirical validation still matters for:

- first model load
- browser cache
- mobile memory
- Korean text
- low-resolution scans
- multi-page documents
- table text
- OCR confidence/calibration

## Required benchmark direction

Create synthetic/public no-PII school-style document fixtures and measure at least:

- document classification precision/recall
- field extraction precision/recall
- duplicate/version decision accuracy
- processing time
- OCR fallback rate
- false auto-apply rate

Accuracy metrics should replace vague claims such as 'works well'.
