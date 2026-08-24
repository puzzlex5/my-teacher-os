# 14. Private Context Guide

## Why this is separate

The public Migration Package intentionally does **not** contain the user's full ChatGPT project conversations or real school data.

A complete AI handoff has two layers:

### Layer A — public/product context

This repository and `MIGRATION_PACKAGE/` contain:

- product philosophy
- architecture
- implementation state
- decisions
- tests
- known issues
- roadmap
- AI handoff instructions

### Layer B — private conversation/context archive

If the user wants a new Claude/ChatGPT account to have historical conversational context, export or save the relevant conversations separately and upload them only to the user's private AI project/workspace.

Do **not** commit the private archive to this public repository.

## Suggested private package

Keep outside GitHub, for example:

```text
teacher-os-private-context/
  conversations-export/
  PROJECT_CONVERSATION_SUMMARY_PRIVATE.md
  USER_WORKFLOW_NOTES_PRIVATE.md
  real-school-test-documents/
```

The exact files depend on what the user wants to transfer.

## What belongs in private context

Only when useful to continued product development:

- prior product discussions not already captured in this package
- user-specific workflow preferences
- real school environment observations
- actual device/browser test results
- anonymized or permissioned real-world examples

Unrelated private conversations do not need to be given to a coding AI just because they existed in the same ChatGPT project.

## Real school documents

If used for empirical testing:

- keep outside the public repository
- prefer anonymized copies where possible
- do not send to third-party AI/cloud services unless the user has explicitly decided that is permitted
- local browser tests are preferred for sensitive documents
- record only sanitized benchmark outcomes back in the repository

## Migration procedure to another AI

1. Transfer/fork/copy the GitHub repository to the desired account if needed.
2. Ensure `main` and `v1-consolidation` are present.
3. Give the new AI repository access.
4. Tell it to read `MIGRATION_PACKAGE/README.md` and `13_AI_HANDOFF_PROMPT.md` first.
5. Add the private conversation archive only inside a private AI project if desired.
6. Ask the new AI to verify the package against actual code before making changes.
7. Run all repository tests before accepting any first migration change.
8. Keep the previous repository/version available until the new environment proves it can build/test/deploy safely.

## Important limitation

No migration package can reproduce another model's internal memory or reasoning identity exactly. The goal is stronger: make the **product state, decisions and verification rules explicit enough that the AI is replaceable**.

The repository plus this package should be the durable source of project continuity.
