# Cross-source editorial audit: protests and beach referee crew (26 October 2026)

**Status: conditional, NOT final normative approval.** This change makes a verified source discrepancy visible before the relevant exams; it does not change exam keys, qualification claims, database schema or stored progress.

## Sources checked

1. Consolidated *Правила вида спорта «самбо»*, order of the Ministry of Sport No. 892 of 04.12.2020, amended through order No. 860 of 14.09.2026: https://sambo.ru/wp-content/uploads/2025/09/pravila-vida-sporta-sambo-s-izm.-i-dopolneniyami.pdf
2. Federation's separate *Изменения от 1 сентября 2026 в правилах*: https://sambo.ru/wp-content/uploads/2025/09/izmeneniya_v_pravila_vida_sporta_sambo_bez_utesheniya.pdf
3. Federation's *Разъяснения по изменениям с 1 сентября 2026*: https://sambo.ru/wp-content/uploads/2025/09/razyasneniya_pravil_vida_sporta_sambo_sentyabr_2026_god.pdf
4. Federation announcement of 31.08.2026: https://old.sambo.ru/press/news/2026/12181/

These files are linked by the Federation's documents listing: https://sambo.ru/documents/ (Rules package dated 15.09.2026).

## Protest timing: article 41(2)(a)

The consolidated PDF (page 31, zero-based page 30) says the representative submits a written protest directly **during the competition**, identifying violated Rules provisions. The separate 2026 changes PDF (page 2, zero-based page 1) and the September 2026 explanations PDF (page 5, zero-based page 4) use **on the day the violation is recorded**, and explicitly require the relevant Rules provisions. The Federation's 31.08.2026 announcement agrees with the latter wording.

This is a discrepancy between simultaneously published source texts, not permission for the course to prescribe an unambiguous later deadline. The introductory and exam screens of the sanctions/protests module now show both source links and the limitation. An authorised clarification is still required before unconditional certification of the teaching claim.

## Beach sambo referee crew: articles 45(4) and 56

The consolidated PDF's article 45(4) lists the area manager and referee, while article 56 mentions a decision by the majority of three. The separate 2026 changes PDF (page 3, zero-based page 2) explicitly lists **area manager, referee and side referee**. The September 2026 explanations PDF (page 6, zero-based page 5) and the Federation's 31.08.2026 announcement likewise identify the side referee as an addition.

The direction of the 2026 amendment is evidenced by the separate files, but the consolidated PDF's wording is inconsistent. The beach module now states both facts rather than implying that the third referee was invented by the course. It still requests authoritative reconciliation of the published consolidated text.

## Verification and preservation

- New regression: `scripts/check-judge-amendment-provenance-2026.cjs` checks both warnings on module introduction and pre-exam screens, safe official links, and the absence of unexpected notices elsewhere.
- `Validate Sambo Academy` runs this test.
- `Browser and deployment smoke tests` checks that the deployed engine contains both notices and official amendment links.
- No changes to exam questions, answer indices, progress keys, or database migrations. Existing historical-result tests remain enabled.

**Open:** normative sign-off by a competent referee, the other identified rule ambiguities, and authenticated end-to-end cloud-progress restoration with a dedicated test account.
