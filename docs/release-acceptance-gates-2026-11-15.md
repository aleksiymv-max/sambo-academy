# Release acceptance gates — 2026-11-15

This document is a **blocking checklist**, not a certificate of readiness. Baseline main: `fae853021a04e7b5434d58e411096a3ba0ba3fce`. Do not infer source approval from passing structural checks.

## Required evidence per active lesson and exam question

Keep one row per stable ID in a versioned inventory with: course, module, lesson/question ID, age education band (7–11 / 12–17 / 18+), level, discipline, current revision, exact Rules article/clause and PDF page, effective date, normative reviewer, illustration origin/license and technique safety reviewer, scenario and explanation review, exam-to-self-check semantic independence, accepted/rejected/pending, reviewer/date/evidence link. Missing evidence means **pending**, never accepted.

Do not change old exam answer keys or IDs in place. Introduce a new revision and retain historical attempt and progress records when an answer or meaning changes. Resolve disputed item 22 against the applicable consolidated official Rules before editing; review items 17–24 independently.

## Hard release blockers

- [ ] Both courses: exhaustive active-ID inventory, point-by-point Rules review and independent pedagogical acceptance.
- [ ] Verify every image's rights and any identifiable faces, metadata, and technical safety. Do not generate technique illustrations as substitutes for approved references.
- [ ] Final-main Validate Sambo Academy and Browser and deployment smoke tests succeed **after** all changes. A runner that never starts is infrastructure-unverified, not a passing test.
- [ ] Production assets are demonstrably identical to the accepted main build.
- [ ] Real separate test accounts: adult athlete, judge, and minor with guardian flow; register, login, reset password, logout, resume progress across devices, exam revision and historical attempts; negative cross-user/role tests. Mock-browser tests do not qualify.
- [ ] Supabase RLS, Storage, server-enforced minor consent, paid entitlements, webhook verification, refund/revocation, promo and group-sale permissions tested on backend. Public JS is never an access-control boundary.
- [ ] Payment operator, contracts, privacy/consent documents, tax and refund flow approved. Do not charge real money without authorization.
- [ ] Certificate issuer, design and rules approved; completion document must not claim an official judge qualification.
- [ ] Full reachable Git history, branches and PR artifacts assessed for author-email exposure, secrets, EXIF and licensing. A tracked-file scanner or .gitignore **does not sanitize history**. Do not force-push, delete branches or rotate credentials without approval.

## Baseline known limitations

The repository was confirmed public on 2026-11-15. A historical author identity exposure remains a documented blocker. The audit script currently asserts **128 active judge exam questions** across the published modules, but that assertion is not independent normative acceptance and must be rerun on the final SHA. Course-specific athlete inventory and actual CI / multiuser production results remain unverified in this document.

## Release decision

Status: **BLOCKED / NOT READY**. No user data, existing exam revisions, paid access or production deployment is modified by this document.
