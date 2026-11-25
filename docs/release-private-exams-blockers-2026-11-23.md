# Release gate: private exams and deployment (23.11.2026)

**Status: BLOCKED — not an approval to merge or deploy.** Evidence snapshot is tied to `main=fae853021a04e7b5434d58e411096a3ba0ba3fce` and PR #134 head `d7e0e4358534b55a9e8cf5566fac144d89f3fcca`. This document is a deployment blocker and test plan, **not** a claim that the platform has passed acceptance.

## Verified in GitHub on 23.11.2026

- Repository visibility: `public`; main branch is not protected (GitHub branches/main response `protected=false`).
- PRs #131, #132, #133 and #134 are **draft**, staged and unmerged. The passing checks on #134 do not certify `main` or production.
- #134 head: [PostgreSQL regression success](https://github.com/aleksiymv-max/sambo-academy/actions/runs/45217733596), [Validate success](https://github.com/aleksiymv-max/sambo-academy/actions/runs/45217733769), [browser smoke success](https://github.com/aleksiymv-max/sambo-academy/actions/runs/45217733567). These do **not** demonstrate authenticated multiuser E2E, payment authorization, or production parity.
- Historic main commit metadata includes a personal address. Gitignore changes do not purge Git history. **Do not quote the address or rewrite history without explicit approval.**

## Blocking checks before merging staged exam storage

- [ ] Review the dependency order #131 → #132 → #133 → #134; run migrations in a disposable PostgreSQL/Supabase instance and verify rollback / forward-only safety. Never run destructive test fixtures against live users.
- [ ] Verify database role permissions: unauthenticated and ordinary authenticated clients cannot SELECT correct-answer keys, private question banks, or another user's attempts; no SECURITY DEFINER function trusts user-supplied identity or course entitlement.
- [ ] Two isolated test accounts A/B: A's attempts and progress are invisible and unmodifiable to B; direct REST/RPC calls cannot impersonate B or change historical results. Include a minor's consent flow with test-only data.
- [ ] Submit an exam with invalid question IDs, wrong version, duplicate answer, negative index, index >= option count, expired attempt, replayed request and revoked entitlement; all fail safely without leaking answers.
- [ ] Verify immutable active exam version and stable historical results across a new version. Existing stable IDs and keys must not silently change.
- [ ] Verify purchase entitlement **server-side** (signed payment provider callback, replay protection, refunds/revocation). Static JS must not contain paid question content or answer keys. Do not enable charges in this test.
- [ ] Verify every active lesson and independent question against the effective official rules edition, image permissions, and documented editorial acceptance; independently review disputed items #17–24 (especially #22) before changing any answer.
- [ ] Confirm final main CI and exact deployed asset hash/SHA parity; distinguish mocked browser smoke from real authenticated E2E.
- [ ] Obtain legal/operator and certificate approvals before commercial launch; no federation branding or official qualification claims without authorization.

**Release decision:** all boxes remain unchecked until separately evidenced. An unverified item is not equivalent to a failed implementation, but it blocks a 100% readiness claim.
