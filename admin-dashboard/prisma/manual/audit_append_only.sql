-- Append-only enforcement for the audit trail.
--
-- RUN THIS AS THE DATABASE OWNER, ONCE, AFTER the forensic migration.
-- It is deliberately NOT part of the Prisma migration: Prisma runs migrations
-- as the application role, and a role cannot meaningfully revoke its own
-- privileges — the grant has to come from above it.
--
-- Effect: the application can INSERT audit rows and read them back, but can no
-- longer UPDATE or DELETE them. An attacker who gets hold of the app's database
-- credentials therefore cannot quietly rewrite history through them.
--
-- Replace :app_role with the role in your DATABASE_URL (Render shows it in the
-- connection string, e.g. "indusinnovate").

-- 1. Remove the ability to rewrite or remove history.
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_logs FROM :"app_role";

-- 2. Keep what the application legitimately needs.
GRANT SELECT, INSERT ON TABLE audit_logs TO :"app_role";
GRANT USAGE, SELECT ON SEQUENCE audit_logs_seq_seq TO :"app_role";

-- 3. Belt and braces: a trigger refuses the operations even if a future GRANT
--    hands the privilege back by accident. Superusers and the table owner can
--    still drop this trigger, so it is a guard against mistakes, not against a
--    determined operator with owner rights.
CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP
    USING HINT = 'Audit records cannot be modified or deleted once written.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();
