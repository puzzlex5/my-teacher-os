# 05. Feature Map

This file is a high-level capability map. Always verify exact behavior against current code/tests.

## Today / Teacher Desk

Purpose: surface the next useful action with minimal navigation.

Capabilities include:

- next-period card/countdown
- lesson context
- today schedule/task overview
- recent resources
- local staff contact search
- deterministic message/official-text cleanup tools
- customizable widgets

Accuracy rule: if live/basic timetable cannot confirm whether a lesson exists, show an unknown/unverified state instead of zero lessons.

## Timetable / Comcigan

- local Comcigan configuration
- school code / teacher index / teacher name persistence
- mismatch guard
- live timetable may override basic timetable
- no-login local configuration

Known limitation: true independent multi-teacher scheduled Comcigan sync is not solved; a shared server collector is not equivalent to per-user sync.

## Teaching progress

- class-specific lesson context
- schedule exceptions
- classes may diverge because of events/cancellations
- progress should be maintained per class/date, not assumed identical across all classes

Long-term goal: actual lesson activity updates progress and next starting point without extra post-class manual logging.

## Assessment

- document-derived assessment candidates
- academic-calendar and timetable linkage
- remaining-lesson reasoning
- annual/school-level policy context

Never hardcode future local guidance as fact when official guidance is unavailable.

## Students / school record

- observation/evidence workflow
- role-aware eligible evidence
- deterministic multiple draft variants
- evidence/date linkage
- quality gate
- 2026 NEIS UTF-8 byte guards for known fields

Do not generate admission probability. No evidence is a critical quality failure.

## Calendar

- imported school events
- manual exceptions only when needed
- edit undo history
- document source linkage

## Work / administration

- projects extracted from documents
- work-pack library with official-source references
- recommendation from existing work descriptions
- removing a work pack should delete only projects created by the Teacher OS work library; pre-existing user projects should only be unlinked

## Clubs

- academic-year club/project tracking
- should not seed personal club defaults for new users
- new-user isolation introduced so another teacher sees blank personal setup

## Search

Global search includes multiple Teacher OS domains and supports Korean initial-consonant matching where appropriate.

Potential domains include:

- students
- contacts
- tasks
- calendar
- assessment
- lessons/progress
- admin/work
- clubs
- resources

## Document intelligence

- automatic document classification
- SHA-256 duplicate detection
- mixed-format extraction
- OCR fallback
- high-confidence auto-apply
- student documents blocked from unsafe automatic application
- correction/feedback signatures stored locally

See `06_DOCUMENT_INTELLIGENCE.md`.

## Document version lineage

- same-document family detection
- explicit version/revision/date comparison
- exact hash duplicate detection
- ambiguous same-name/different-content requires review
- older explicit version is not automatically allowed to replace newer data
- safe replacement snapshots structured state for undo

## Source retention

- transient/raw not retained
- reference metadata retention
- user-opted local IndexedDB original retention
- device storage self-test

## Recovery / backup

- browser-local snapshots
- pre-import/pre-restore/manual recovery
- JSON backup/restore for structured state
- raw locally retained document Blob is not included in ordinary JSON backup

## Tester feedback

- local feedback reports
- privacy warning
- share/clipboard/GitHub issue pathways with non-sensitive context
- no private central feedback backend yet
