# Foundations v2 — independent review register for questions 17–24

Status: **OPEN / NOT NORMATIVELY ACCEPTED**. Baseline: main `fae853021a04e7b5434d58e411096a3ba0ba3fce` (2026-11-16). This is an editorial gate, not an assertion that the answers are wrong.

## Non-destructive acceptance protocol

1. Extract each *active* question's stable ID, exact stem, options, answer index, explanation and version from the running exam bank. Confirm the display number maps to that ID. Never infer an ID from the display number.
2. Record the authoritative consolidated Rules PDF revision, official publication, effective date, **article, paragraph, appendix and PDF page** for the actual question. If any element cannot be verified, mark `source_unverified`.
3. Independently decide the correct answer from the cited rule *before* looking at the stored answer index. Record reviewer and date; flag disagreement rather than silently changing keys.
4. Review plausible distractors, one unambiguous answer, age/discipline applicability, question wording, and both lexical and semantic overlap with all self-checks and active exam questions.
5. Preserve the existing version, IDs, answer keys and historic attempts until a new version with an explicit migration/retention policy has been reviewed. Do not deploy draft edits.
6. Require second-person domain review for technique/safety interpretation and final publication approval. An automated structural test is not a normative review.

| Display # | Current editorial risk to investigate | Exact ID / version | Rule evidence (article/point/appendix/PDF page) | Independent answer check | Semantic overlap | Acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| 17 | Source and answer audit pending | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[4] | Unverified | Pending | Pending | Blocked |
| 18 | Source and answer audit pending | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[5] | Unverified | Pending | Pending | Blocked |
| 19 | Source and answer audit pending | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[6] | Unverified | Pending | Pending | Blocked |
| 20 | Source and answer audit pending | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[7] | Unverified | Pending | Pending | Blocked |
| 21 | Reported cue from a numerical threshold; verify actual wording and source | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[8] | Unverified | Pending | Pending | Blocked |
| 22 | Reported implausible distractors and overlap with #9; verify both against active bank | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[9] | Unverified | Pending | Pending | Blocked |
| 23 | Reported insufficiently applied scenario and possible overlap | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[10] | Unverified | Pending | Pending | Blocked |
| 24 | Reported semantic overlap with #12 and #15 | No immutable ID; Foundations v2 / 2026-10-26-2 / progressIndex 2100 / examApplication[11] | Unverified | Pending | Pending | Blocked |

The table above now uses a composite source locator instead of the misleading `To extract` placeholder. It is **not** a newly assigned immutable ID; no learner record or key was migrated. This explicitly prevents display number alone from being treated as identity across exam banks.

## Verified code mapping (2026-11-16; not normative approval)

The active `judge-exam-foundations-v2.js` bank concatenates twelve new cases with `original.questions.slice(12)`. The historical `judge-foundations.js` constructs `original.questions` from `examBase.concat(examApplication)`, with twelve `examApplication` entries. Thus display items **17–24** are original `examApplication[4]–[11]`. Active version: `2026-10-26-2`, revision 2, progress index 2100; historical progress index 1100. **No stable question ID field was found in these objects**; display position is not an immutable ID.

| Display | Source-code stem locator | Stored answer index (0-based) | Cited norm in existing explanation (not independently verified this cycle) | Status |
| --- | --- | ---: | --- | --- |
| 17 | Личные места, делегации без командного зачёта | 1 | Ст. 1, пп. 1–3 | Source mapped; normative pending |
| 18 | Личные места в командный итог по Положению | 2 | Ст. 1, п. 5 | Source mapped; normative pending |
| 19 | Три подгруппы без правила перехода | 0 | Ст. 2, п. 1 | Source mapped; normative pending |
| 20 | Жеребьёвка до выбора способа | 0 | Ст. 2, пп. 3–4 | Source mapped; normative pending |
| 21 | Восемь участников, порог семи | 1 | Ст. 2, п. 5 | Source mapped; normative pending |
| 22 | Шесть участников, круговая по Положению | 1 | Ст. 2, п. 5; приложение 2, раздел I, п. 1 | Source mapped; normative pending |
| 23 | Семь участников без иного способа | 1 | Ст. 2, пп. 2(в), 5; приложение 5 | Source mapped; normative pending |
| 24 | Изменение после начала жеребьёвки | 1 | Приложение 1, п. 4 | Source mapped; normative pending |

This is a verified source-code trace, **not an independent correctness check**. Official PDF page/effective-date verification, plausible alternatives, semantic independence, and a second reviewer remain pending for all eight. Positional identity is a compatibility risk: reordering historical questions could remap active v2 questions. Do not change answer keys, historical attempts, or invent retrospective IDs; design a versioned migration first.

## Release gate

No row may become `accepted` without an exact source reference, verified answer, checked alternatives, independent exam/self-check review, reviewer identity/date, and confirmed applicability. The reported risks above are **leads from prior editorial review**, not freshly verified defects. Do not use this register as evidence of normative approval. This file does not modify published exam data, payments or learner progress.

## Critical disambiguation: two different question #22 records (2026-11-16)

**Display numbers are not identities across exam banks.** The #22 in this register is **Foundations v2** (`judge-exam-foundations-v2.js`; historical `judge-foundations.js`, `examApplication[9]`): a six-participant round-robin scenario, stored answer index 1 (zero-based), citing article 2(5) and appendix 2. Its reported concern is weak distractors/overlap, **not** painful-hold counting.

A **different** #22 appears in the **independent judges' exam** (`judge-exam-independent.js`), tracked by [issue #104](https://github.com/aleksiymv-max/sambo-academy/issues/104) and `docs/editorial-independent-officials-items-17-24-2026-11-04.md`. It concerns support from another judge for starting a painful-hold count, with a disputed article 19(6) versus 18(6) reference. That issue remains blocked pending authoritative page-level source and effective-date verification. Its answer index must **not** be transferred to Foundations v2.

Until immutable IDs are introduced via a versioned non-destructive migration, identify questions using `(bank file, exam version, progressIndex, display number, source locator)`. Maintain separate acceptance records and independent normative reviews. **Neither #22 is accepted by this clarification.** No exam keys, versions, questions, or historical results are changed.
