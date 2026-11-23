-- Regression gate: neither browser role may read private exam keys or results.
-- Run after all staged exam_private migrations in disposable PostgreSQL.
-- Does not use real users, keys, or production data.
DO $check$
DECLARE
  role_name text;
  table_name text;
  rls_enabled boolean;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF has_schema_privilege(role_name, 'exam_private', 'USAGE')
       OR has_schema_privilege(role_name, 'exam_private', 'CREATE') THEN
      RAISE EXCEPTION 'Browser role % has access to private exam schema', role_name;
    END IF;
    FOREACH table_name IN ARRAY ARRAY['versions','questions','attempts','answers'] LOOP
      IF has_table_privilege(role_name, format('exam_private.%I', table_name),
         'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
        RAISE EXCEPTION 'Browser role % has privileges on exam_private.%', role_name, table_name;
      END IF;
    END LOOP;
  END LOOP;

  FOREACH table_name IN ARRAY ARRAY['versions','questions','attempts','answers'] LOOP
    SELECT c.relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'exam_private' AND c.relname = table_name AND c.relkind = 'r';
    IF rls_enabled IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'RLS missing on exam_private.%', table_name;
    END IF;
  END LOOP;
END
$check$;
