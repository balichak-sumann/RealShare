-- Forensic audit log upgrade.
--
-- Safe to run on a populated table: existing rows are preserved, backfilled
-- with actor snapshots from their current profile, and folded into the hash
-- chain in chronological order so verification passes from the first row.
--
-- Run inside one transaction so a partial upgrade cannot happen.

BEGIN;

-- 1. Actor snapshot ---------------------------------------------------------
-- The actor is copied onto the row so the record survives the person being
-- deleted. Previously the FK cascaded and deleting an employee destroyed their
-- entire history.
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_email" VARCHAR(255);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_name"  VARCHAR(255);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_role"  VARCHAR(50);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_dept"  VARCHAR(50);

-- 2. What happened ----------------------------------------------------------
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "outcome" VARCHAR(20) NOT NULL DEFAULT 'success';
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "before"  JSONB;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "after"   JSONB;

-- 3. Request context --------------------------------------------------------
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "ip_address"  VARCHAR(64);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "user_agent"  TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "request_id"  VARCHAR(64);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "http_method" VARCHAR(10);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "path"        VARCHAR(512);

-- 4. Tamper evidence --------------------------------------------------------
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "prev_hash" VARCHAR(64);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "hash"      VARCHAR(64);

-- Gapless counter. Populated in chronological order rather than physical order
-- so the chain built below follows real event order.
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "seq" BIGINT;

DO $$
DECLARE
  next_seq BIGINT := 1;
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM "audit_logs" WHERE "seq" IS NULL ORDER BY "created_at" ASC, "id" ASC LOOP
    UPDATE "audit_logs" SET "seq" = next_seq WHERE id = r.id;
    next_seq := next_seq + 1;
  END LOOP;
END $$;

CREATE SEQUENCE IF NOT EXISTS "audit_logs_seq_seq" OWNED BY "audit_logs"."seq";
SELECT setval('audit_logs_seq_seq', COALESCE((SELECT MAX("seq") FROM "audit_logs"), 0) + 1, false);
ALTER TABLE "audit_logs" ALTER COLUMN "seq" SET DEFAULT nextval('audit_logs_seq_seq');
ALTER TABLE "audit_logs" ALTER COLUMN "seq" SET NOT NULL;

-- 5. Backfill actor snapshots from the profiles that still exist -------------
UPDATE "audit_logs" a
SET "actor_email" = p."email",
    "actor_name"  = p."full_name",
    "actor_role"  = p."role",
    "actor_dept"  = p."employee_department"
FROM "profiles" p
WHERE a."employee_id" = p."id" AND a."actor_email" IS NULL;

-- 6. Break the cascade ------------------------------------------------------
-- The old FK cascaded: deleting an employee deleted their entire history.
-- The constraint is dropped rather than switched to SET NULL, because SET NULL
-- still MUTATES the audit row when a profile is removed — which the append-only
-- rule forbids, and which would make deleting any employee fail outright once
-- that rule is applied. employee_id is kept as a plain historical reference and
-- attribution comes from the snapshot columns written above.
ALTER TABLE "audit_logs" ALTER COLUMN "employee_id" DROP NOT NULL;
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_employee_id_fkey";

-- 7. Fold existing rows into the hash chain ---------------------------------
-- Must match computeRowHash() in src/lib/audit.ts exactly, or verification
-- will report the pre-migration rows as tampered.
DO $$
DECLARE
  prev TEXT := NULL;
  r RECORD;
  payload TEXT;
  row_hash TEXT;
BEGIN
  FOR r IN SELECT * FROM "audit_logs" ORDER BY "seq" ASC LOOP
    payload := COALESCE(prev, '')
      || '|' || r."seq"::TEXT
      || '|' || COALESCE(r."actor_email", '')
      || '|' || COALESCE(r."actor_name", '')
      || '|' || COALESCE(r."actor_role", '')
      || '|' || r."action"
      || '|' || r."entity_type"
      || '|' || r."entity_id"
      || '|' || r."outcome"
      || '|' || COALESCE(r."before"::TEXT, '')
      || '|' || COALESCE(r."after"::TEXT, '')
      || '|' || COALESCE(r."details"::TEXT, '')
      || '|' || to_char(r."created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

    row_hash := encode(sha256(convert_to(payload, 'UTF8')), 'hex');
    UPDATE "audit_logs" SET "prev_hash" = prev, "hash" = row_hash WHERE id = r.id;
    prev := row_hash;
  END LOOP;
END $$;

ALTER TABLE "audit_logs" ALTER COLUMN "hash" SET NOT NULL;

-- 8. Indexes for actual investigation queries -------------------------------
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"  ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_employee_id_idx" ON "audit_logs"("employee_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx"      ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"      ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_outcome_idx"     ON "audit_logs"("outcome");
CREATE UNIQUE INDEX IF NOT EXISTS "audit_logs_seq_key"  ON "audit_logs"("seq");

COMMIT;
