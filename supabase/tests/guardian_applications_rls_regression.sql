-- Isolated PostgreSQL-only RLS regression; never run against production.
-- Exercises database role authenticated, two synthetic auth identities and cross-user denial.
BEGIN;
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-4000-8000-0000000000a1'),
 ('00000000-0000-4000-8000-0000000000b2');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
INSERT INTO public.guardian_applications
 (user_id,child_last_name,child_first_name,child_birth_date,guardian_full_name,
  guardian_relation,declaration_text,consent_version,consent_at)
VALUES
 ('00000000-0000-4000-8000-0000000000a1','Synthetic','Child',DATE '2010-01-01',
  'Synthetic Guardian','parent','Test acknowledgment','test-v1',now());
DO $$
BEGIN
 IF (SELECT count(*) FROM public.guardian_applications) <> 1 THEN
  RAISE EXCEPTION 'Owner cannot read own application';
 END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000b2',true);
DO $$
DECLARE denied boolean := false;
BEGIN
 IF (SELECT count(*) FROM public.guardian_applications) <> 0 THEN
  RAISE EXCEPTION 'Cross-user SELECT exposed another application';
 END IF;
 BEGIN
  INSERT INTO public.guardian_applications
   (user_id,child_last_name,child_first_name,child_birth_date,guardian_full_name,
    guardian_relation,declaration_text,consent_version,consent_at)
  VALUES
   ('00000000-0000-4000-8000-0000000000a1','Synthetic','Child',DATE '2010-01-01',
    'Synthetic Guardian','parent','Test acknowledgment','test-v1',now());
 EXCEPTION WHEN insufficient_privilege THEN denied := true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Cross-user INSERT was not denied'; END IF;
 denied := false;
 BEGIN
  UPDATE public.guardian_applications SET status='approved'
   WHERE user_id='00000000-0000-4000-8000-0000000000a1';
 EXCEPTION WHEN insufficient_privilege THEN denied := true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Authenticated user can UPDATE applications'; END IF;
END $$;
INSERT INTO public.guardian_applications
 (user_id,child_last_name,child_first_name,child_birth_date,guardian_full_name,
  guardian_relation,declaration_text,consent_version,consent_at)
VALUES
 ('00000000-0000-4000-8000-0000000000b2','Synthetic','Child',DATE '2010-01-01',
  'Synthetic Guardian','parent','Test acknowledgment','test-v1',now());
DO $$
BEGIN
 IF (SELECT count(*) FROM public.guardian_applications) <> 1 THEN
  RAISE EXCEPTION 'Second user cannot see exactly their own application';
 END IF;
END $$;
RESET ROLE;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.guardian_applications
   WHERE user_id IN ('00000000-0000-4000-8000-0000000000a1',
                     '00000000-0000-4000-8000-0000000000b2')) <> 2 THEN
  RAISE EXCEPTION 'Fixture count mismatch';
 END IF;
 RAISE NOTICE 'PASS: two-user RLS read/insert isolation and UPDATE denial';
END $$;
ROLLBACK;
