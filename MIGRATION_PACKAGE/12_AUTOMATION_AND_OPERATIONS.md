# 12. Automation and Operations

## Autonomous development policy

Teacher OS is intended to keep improving without requiring the user to manually request every next step.

The automation should:

- inspect repository and latest deployment
- continue the highest-value unfinished task
- fix low-risk reversible bugs directly when safe
- improve correctness before speed
- improve speed only when correctness is not reduced
- progress 1.0 consolidation in `v1-consolidation`
- keep public `main` stable during high-risk refactors
- run relevant tests plus broad regression tests
- verify live Pages assets after public deployment

Do not finish a run by merely reporting a safe actionable defect when it can be fixed and tested in the same run.

## Operating modes

### Regular incremental mode

Small reversible improvements:

- bug fixes
- guards
- regression tests
- performance cleanup
- privacy hardening
- minor UX accuracy fixes

### Precision audit mode

Periodically inspect full flows:

`input → interpretation → auto-apply → persistence → reload → recovery`

Focus areas:

- tables/merged cells
- scanned PDFs
- OCR fallback
- confidence thresholds
- student auto-apply blocks
- Comcigan mismatch
- mobile CSS
- local recovery

### Focus improvement mode

Prioritize:

1. largest correctness risk
2. largest speed bottleneck that can be improved without lowering correctness
3. highest-value 1.0 consolidation task

## Safe autonomous change boundary

Usually safe:

- tests
- syntax fixes
- conservative error handling
- clearly scoped UI correctness
- low-risk performance improvements
- non-destructive refactors on consolidation branch
- documentation updates

Requires user decision or explicit architecture approval:

- authentication/account system
- external private backend storing school-sensitive data
- new external transmission of sensitive information
- destructive migration without proven rollback
- major privacy-boundary changes

## Deployment policy

For public changes:

1. fetch current file SHA before update
2. make minimal sequential writes for same path
3. run regression/syntax checks
4. let Pages deploy
5. verify project URL and latest assets return HTTP 200
6. distinguish deployed from actual-device functional validation

## Reporting policy

Only notify the user for meaningful events:

- important bug fixed
- meaningful correctness/performance improvement
- 1.0 milestone
- blocker requiring user decision
- actual risk discovered

Do not generate noise when nothing meaningful changed.

## After 1.0

Automation should not stop. Switch from consolidation mode to:

- regression maintenance
- document benchmark expansion
- correctness calibration
- performance maintenance
- privacy audits
- real-teacher feedback fixes
