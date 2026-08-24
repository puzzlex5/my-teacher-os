# 07. Teaching and Student Workflows

## Teaching workflow

Teacher OS should not stop at displaying a timetable. The intended chain is:

`actual timetable → class → previous lesson → current progress → today start point → assessment horizon → required resources`

## Timetable truth

Priority should distinguish sources:

1. confirmed live/current timetable when valid
2. basic timetable
3. otherwise unknown/unverified

A missing source is not proof of no class.

## Class-specific progress

Classes diverge because of:

- holidays
- exams
- school events
- field trips
- cancellations
- class-specific disruptions

Therefore progress must support:

- weekly schedule baseline
- date-specific exceptions
- class-specific lesson state
- next starting point per class

Do not assume all classes of the same grade are on the same lesson.

## Lesson recording / speech recognition

The product direction includes one-tap lesson capture with a default class duration and browser wake/speech-recognition assistance.

Important limitations:

- browser background/screen-off behavior is not guaranteed
- raw recordings should not be persisted by default
- speech recognition can restart but is still runtime/browser dependent
- do not claim real M4A/MP3 empirical validation unless actually tested

## Student evidence model

Student-record drafting should start from evidence, not from free-form flattering generation.

Intended flow:

`eligible observation → evidence/date → behavior/process/growth → draft variants → quality gate → byte limit → teacher review`

## Draft principles

- role-aware evidence only
- multiple deterministic variants may be offered
- keep evidence/date linkage
- no unsupported achievements
- no admission probability claims
- no fabricated growth

## Quality gate

Current quality model checks concepts including:

- grounding/evidence
- specificity
- growth
- process
- clarity
- safety/prohibited content

No evidence should be treated as critical rather than merely lowering a cosmetic score.

## NEIS byte limits

Known hardcoded byte rules are year-specific, not universal future policy.

For 2026, current code contains UTF-8 byte limits for known school-record fields. Future years without verified official limits should show an update-needed state rather than invent a number.

## Sensitive-data barrier

Counseling, school-violence and life-guidance content can be stored/used locally when appropriate, but must not automatically become official student-record evidence.

The eligibility boundary must remain explicit during 1.0 consolidation.

## Future high-value improvements

- better evidence-to-draft semantic grounding
- draft version diff
- quick observation memo with minimal input
- lesson-to-evidence linkage with explicit teacher confirmation
- better source/date visibility in final draft review
