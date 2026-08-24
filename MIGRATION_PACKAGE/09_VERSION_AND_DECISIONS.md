# 09. Version and Decision History

This is a compact decision log, not a full changelog. Verify exact implementation in code/tests.

## Major evolution

- v0.6: scheduling/progress foundations
- v0.7: Comcigan/bulk handling
- v0.8: auto apply
- v0.9: lesson audio flow
- v0.10: automation
- v0.11-v0.13: UI, command center, search/inbox/history
- v0.14: local Comcigan config
- v0.15: manual timetable UI reduced
- v0.16: lesson context
- v0.17: guards
- v0.18: HWP handling
- v0.19: work library
- v0.20: role/student/counseling structures
- v0.21: evidence-based student record studio
- v0.22: local recovery snapshots
- v0.23: document intelligence
- v0.24: per-browser personal isolation/new users blank
- v0.25: school-record quality gate
- v0.26: tester feedback
- v0.27: Teacher Desk
- v0.28: Korean initial-consonant search, NEIS bytes, calendar undo
- v0.29: verified data-state semantics
- v0.30: document version lineage and conservative replacement
- v0.31: three-tier source retention and local original vault
- v0.32: real-device IndexedDB vault self-test

## Key decisions that must survive migration

### TeacherDesk is reference, not target

Useful principles may be adopted. Do not clone its UI/code/assets or reshape Teacher OS into a desktop-only tool.

### Web-first

The primary product remains web-based. A desktop companion is optional and evidence-driven, not currently required.

### No repeated input

School documents should be the source whenever possible.

### Unknown is a valid state

Do not turn `unverified`, `failed`, `unconfigured` or `mismatch` into confirmed empty/zero.

### High-confidence auto apply only

Ambiguity means review.

### Version order is evidence-based

Upload order is not version order. Prefer explicit version/revision/date/hash evidence.

### Existing originals stay authoritative

Teacher OS should not tell the user to delete the official file from their PC/school storage.

### Raw source retention is opt-in only

Default is no long-term raw retention in Teacher OS.

### Sensitive documents may be used locally

Do not block useful local processing merely because documents are sensitive. Block external leakage instead.

### Student-sensitive material is not automatically official evidence

Maintain a firewall between local counseling/life-guidance context and official school-record drafting.

### New teachers/users must not inherit personal defaults

Per-browser profile isolation is important. Do not seed user-specific clubs/music setup into fresh users.

### 1.0 consolidation over feature-layer growth

From v0.32 onward, priority shifts from adding historical layers to consolidating architecture, measuring document accuracy and hardening real-world behavior.

## TeacherDesk analysis lessons retained

Static inspection of TeacherDesk provided useful design ideas such as:

- Korean initial-consonant search
- no-data vs load-failure distinction
- byte-limit checks
- undo/history
- damaged storage not treated as empty
- backup/snapshots
- faster initial UI by deferring heavy data
- parallel independent loading
- multiple timetable perspectives
- extract → validate → apply flow
- integrated search

Windows-specific mechanisms are not copied simply because TeacherDesk uses them.
