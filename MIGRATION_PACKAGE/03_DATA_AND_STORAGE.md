# 03. Data and Storage

## Primary state model

Teacher OS currently keeps structured user data primarily in browser localStorage under the application's main state key. Data is organized by academic year and includes structures such as:

- calendar events
- timetable
- assessments
- projects/admin work
- clubs
- document import metadata
- teaching/progress context
- work packs
- memories/preferences depending on version

Do not assume this list is exhaustive. Inspect the current code before changing schemas.

## Browser-local auxiliary stores

Known local stores include, among others:

- Comcigan local configuration
- device profile / first-run isolation
- recovery snapshots
- document replacement history
- staff contacts
- calendar edit history
- feedback reports
- Teacher Desk widget preferences
- source retention metadata
- local source-file IndexedDB vault
- device IndexedDB self-test result

When consolidating, inventory all actual keys from code before migration.

## Data compatibility rule

**Never break existing browser data silently.**

Any schema change must:

1. detect old shape safely
2. migrate deterministically
3. preserve unknown fields when practical
4. snapshot before destructive migration
5. keep a rollback path
6. test reload after migration

## Recovery

Teacher OS has browser-local recovery snapshots using IndexedDB. The recovery design includes limited snapshots such as daily, pre-import, pre-restore and manual snapshots.

A destructive document replacement also stores structured pre-replacement state for undo. If the undo snapshot cannot be stored, replacement must not proceed.

## Document imports

Persistent import records should contain metadata and derived structured data, not raw document contents by default.

Typical metadata may include:

- id
- name
- SHA-256 hash
- document class/label
- confidence
- extraction method
- import time
- file size/lastModified when available
- family/version lineage
- retention policy

Do not claim raw source data is immediately cryptographically erased from memory. The correct promise is that raw originals are not persisted by default and file selection is released after processing.

## Three-tier source retention

Current policy:

### transient

- raw original not retained
- minimum processing/version metadata retained

### reference

- raw original not retained
- source location note, hash, family and version lineage may be retained
- important structured document classes default here in automatic mode

### local

- only when explicitly selected
- original Blob stored in browser IndexedDB
- never automatically uploaded to GitHub or an external server
- browser storage may still be lost by browser/device cleanup

The authoritative original should remain in the user's official PC/school storage.

## Device vault safety

The local-original option is guarded by an on-device self-test:

`IndexedDB open → test Blob write → read → content/hash integrity → delete → deletion verification`

The local-original option should only be trusted when this device test passes recently. Failure should fall back to reference retention rather than force raw storage.

## Cross-device synchronization

True account-based cross-device sync is not yet solved. Do not present browser-local data as synchronized across PCs or phones.

Future sync must be designed with privacy, authentication and conflict resolution before implementation. Never automatically send school-sensitive data to a public/static backend.
