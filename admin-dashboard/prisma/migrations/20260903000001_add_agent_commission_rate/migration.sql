-- Adds a per-agent, admin-settable commission rate. Nullable so existing rows
-- are unaffected; NULL means "use the platform default" in application code.
ALTER TABLE "profiles" ADD COLUMN "commission_rate_pct" DECIMAL(5,2);
