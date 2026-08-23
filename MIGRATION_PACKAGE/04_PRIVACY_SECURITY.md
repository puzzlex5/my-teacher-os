# 04. Privacy and Security

## Canonical rule

> Sensitive school documents are allowed for local use. External leakage is not allowed.

Teacher OS should support local reading, classification, search, summarization and linkage of school-internal documents when the user needs them.

## Must never be committed or uploaded automatically

- raw school-internal documents
- extracted sensitive text
- student names/identifiers or other PII in fixtures/logs
- counseling records or school-violence narratives
- staff contact raw data
- lesson/counseling recordings
- sensitive import metadata
- secrets, tokens or authentication material

Destinations explicitly forbidden for automatic leakage:

- public GitHub repository
- GitHub Pages static assets
- CI logs
- public test fixtures
- GitHub issue URLs/bodies
- external servers without explicit approved private architecture

## Local processing

Browser-local storage may be used when appropriate:

- localStorage for structured app state/preferences
- IndexedDB for recovery snapshots
- IndexedDB for user-opted local original retention
- in-memory document parsing/OCR

The UI should clearly state what is stored locally and what is not.

## Student record firewall

Counseling, school-violence, life-guidance or other sensitive content must not automatically flow into official school-record evidence simply because it exists locally.

Official school-record drafts require eligible evidence and explicit product rules.

## Feedback and diagnostics

Feedback/error reports should contain non-sensitive technical context only.

Before constructing a shareable report or GitHub issue link, strip or block:

- student names
- document text
- phone numbers
- staff contacts
- imported raw metadata that could reveal sensitive context

## Raw-source retention

Default raw source retention is off.

If the user explicitly chooses local raw retention:

- store only in local IndexedDB
- verify the device vault with self-test
- allow delete/purge controls
- warn that it is not an official backup
- do not include raw Blob data in ordinary JSON backup

## Public diagnostics

CI diagnostics committed to a public repository must be sanitized allowlists of operational state only. Do not persist raw GitHub API responses containing unnecessary account/profile metadata.

## Changes requiring user decision

Do not autonomously deploy changes involving:

- authentication architecture
- private backend containing sensitive data
- external transmission of school data
- destructive data migration with material loss risk
- permission expansion that changes the privacy boundary

These require explicit approval and a documented threat/data-flow review.
