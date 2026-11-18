# Foundations v2: acceptance register for active items 17–24

Date: 2026-11-18. Scope: judge course, Foundations v2 only. **All eight items are NOT accepted for release.** This is an editorial gate, not a certification of normative correctness. Do not change existing answer keys, exam revision/version, or historical results. Historical Foundations v1 uses progressIndex=1100; active Foundations v2 uses progressIndex=2100. Neither bank has immutable per-question IDs established by the locator guard.

Source of active identifiers and current concerns: `docs/editorial-foundations-exam-items-17-20-2026-11-03.md` and `docs/editorial-foundations-exam-items-21-24-2026-11-03.md`. Normative reference candidate: consolidated SAMBO rules, Ministry order 892 as amended by order 860 (2026-09-14), https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf . References below must be rechecked against the exact operative PDF and publication date before approval.

| Display locator (not immutable ID) | Skill / topic | Normative locator to verify | Editorial defect / independent skill required | Status |
|---|---|---|---|---|
| #17 / examApplication[4] | Personal vs team event | Art. 1(1–4) | Replace definition recall with regulation/protocol decision; compare earlier character-of-event items | blocked |
| #18 / examApplication[5] | Individual-team result | Art. 1(2,5) and event regulations | Require calculation using explicit regulation formula; avoid inventing scoring formula | blocked |
| #19 / examApplication[6] | Advancement from subgroups | Art. 2(1,3–4) | Replace article-number distractors with plausible officials' actions; compare item 6 and lesson 4 self-check | blocked |
| #20 / examApplication[7] | System before draw | Art. 2(3–4), appendix 1(3–4) | Resolve conflicting bracket and regulations; compare items 7/16 and lesson 6 | blocked |
| #21 / examApplication[8] | Eight competitors | Art. 2(4–5), appendix applicable to regulation | Do not infer prohibition of six-penalty-point system at eight; compare item 23 | blocked |
| #22 / examApplication[9] | Six competitors, round robin | Art. 2 and appendix 2(I.1), PDF p.60 in 2026-11-03 review | Test sequence after first loss, not merely round-robin eligibility; compare item 9 | blocked |
| #23 / examApplication[10] | Seven competitors, subgroup exception | Art. 2(2)(v,5), appendix 5(I.1), PDF p.72 in 2026-11-03 review | Explicitly test one-subgroup exception; compare items 8/21 | blocked |
| #24 / examApplication[11] | Changing event regulations after draw | Art. 2(3–4), appendix 1(4) | Semantic duplication with items 12/15; choose a distinct adjudication skill | blocked |

**Mandatory acceptance fields for each row before release:** exact rule edition and effective date; article/subparagraph/appendix/PDF page and independently checked excerpt; lesson and age/discipline applicability; four plausible options; one unambiguous key with rationale; semantic comparison with all 24 exam items and all corresponding lesson self-checks; rights check for any illustration; editorial reviewer/date; independent judge reviewer/date when necessary; versioned migration plan preserving legacy exam attempts. None of these fields is implicitly passed by a green CI.

**Implementation gate:** prepare new items under a new exam revision and separate progress identity, retain the old revision read-only for historical attempts, test both revisions and Supabase result restoration with two synthetic accounts, then obtain independent approval before merging or deploying. Do not publish draft scenarios or change live keys on this evidence alone.

**Coverage:** eight of eight display positions have a documented *issue/locator* in this register; zero of eight are fully accepted. This says nothing about acceptance of the other exam items or the athlete course.

**Evidence reconciliation (2026-11-18):** `scripts/check-foundations-v2-question-locators.cjs` explicitly confirms active `version=2026-10-26-2`, `progressIndex=2100`, and source positions `examApplication[4..11]` for display questions 17–24. Its comment states that positional locators do **not** assign immutable IDs. The earlier `exam-017`–`exam-024` labels were editorial placeholders, not verified persisted identifiers. Historical v1 retains `progressIndex=1100`. Do not use placeholder labels as migration keys.
