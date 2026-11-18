-- Guard new guardian applications without rewriting historical records.
-- Apply manually after reviewing the deployed schema and existing rows.
-- PostgreSQL NOT VALID checks existing rows later, but enforces new INSERT/UPDATE now.
-- This is evidence of form acknowledgement, NOT legal verification of parental consent.
BEGIN;
ALTER TABLE public.guardian_applications
  ADD CONSTRAINT guardian_application_consent_evidence_required
  CHECK (
    consent_version IS NOT NULL
    AND length(btrim(consent_version)) > 0
    AND consent_at IS NOT NULL
    AND declaration_text IS NOT NULL
    AND length(btrim(declaration_text)) > 0
  ) NOT VALID;
COMMIT;

-- Preflight on existing data (run separately; do not publish personal details):
-- SELECT count(*) AS historical_missing_evidence
-- FROM public.guardian_applications
-- WHERE consent_version IS NULL OR length(btrim(consent_version)) = 0
--    OR consent_at IS NULL
--    OR declaration_text IS NULL OR length(btrim(declaration_text)) = 0;
--
-- Only after reviewing historical exceptions and approved consent text:
-- ALTER TABLE public.guardian_applications
--   VALIDATE CONSTRAINT guardian_application_consent_evidence_required;
--
-- Regression checks in a rollback-only transaction with two disposable auth test
-- users: INSERT with NULL/blank consent_version, NULL consent_at or blank
-- declaration_text must fail; a complete pending application must pass RLS.
-- Do not use real children, real guardian identities or production writes.
