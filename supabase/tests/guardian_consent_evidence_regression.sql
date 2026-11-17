-- Run ONLY in an isolated/staging PostgreSQL database after applying
-- 20261117_guardian_consent_evidence_not_valid.sql.
-- Read-only with respect to the application table: a temporary LIKE table is used.
-- This is NOT a live RLS or legal-consent test.
BEGIN;
DO $test$
DECLARE
  constraint_present boolean;
  rejected boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.guardian_applications'::regclass
      AND conname = 'guardian_application_consent_evidence_required'
      AND contype = 'c'
  ) INTO constraint_present;
  IF NOT constraint_present THEN
    RAISE EXCEPTION 'Consent evidence constraint is not deployed';
  END IF;

  CREATE TEMP TABLE guardian_consent_probe
    (LIKE public.guardian_applications INCLUDING CONSTRAINTS) ON COMMIT DROP;

  -- Each probe is isolated in a subtransaction, preserving the test table.
  rejected := false;
  BEGIN
    INSERT INTO guardian_consent_probe
      (user_id, child_last_name, child_first_name, child_birth_date,
       guardian_full_name, guardian_relation, declaration_text, consent_version, consent_at)
    VALUES
      ('00000000-0000-4000-8000-000000000001', 'Test', 'Child', DATE '2010-01-01',
       'Test Guardian', 'parent', 'Acknowledged', NULL, now());
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'NULL consent_version was accepted'; END IF;

  rejected := false;
  BEGIN
    INSERT INTO guardian_consent_probe
      (user_id, child_last_name, child_first_name, child_birth_date,
       guardian_full_name, guardian_relation, declaration_text, consent_version, consent_at)
    VALUES
      ('00000000-0000-4000-8000-000000000002', 'Test', 'Child', DATE '2010-01-01',
       'Test Guardian', 'parent', 'Acknowledged', '   ', now());
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Blank consent_version was accepted'; END IF;

  rejected := false;
  BEGIN
    INSERT INTO guardian_consent_probe
      (user_id, child_last_name, child_first_name, child_birth_date,
       guardian_full_name, guardian_relation, declaration_text, consent_version, consent_at)
    VALUES
      ('00000000-0000-4000-8000-000000000003', 'Test', 'Child', DATE '2010-01-01',
       'Test Guardian', 'parent', 'Acknowledged', 'v-test', NULL);
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'NULL consent_at was accepted'; END IF;

  rejected := false;
  BEGIN
    INSERT INTO guardian_consent_probe
      (user_id, child_last_name, child_first_name, child_birth_date,
       guardian_full_name, guardian_relation, declaration_text, consent_version, consent_at)
    VALUES
      ('00000000-0000-4000-8000-000000000004', 'Test', 'Child', DATE '2010-01-01',
       'Test Guardian', 'parent', '  ', 'v-test', now());
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Blank declaration_text was accepted'; END IF;

  INSERT INTO guardian_consent_probe
    (user_id, child_last_name, child_first_name, child_birth_date,
     guardian_full_name, guardian_relation, declaration_text, consent_version, consent_at)
  VALUES
    ('00000000-0000-4000-8000-000000000005', 'Test', 'Child', DATE '2010-01-01',
     'Test Guardian', 'parent', 'Acknowledged', 'v-test', now());

  RAISE NOTICE 'PASS: 4 invalid consent-evidence cases rejected; valid evidence accepted';
END
$test$;
ROLLBACK;
