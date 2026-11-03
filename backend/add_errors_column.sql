-- Adds the "Errors" player stat (plain counter, like Dimes).
-- Run this against the Neon database BEFORE deploying the backend that references it.
-- Column names are quoted because the existing stat columns are mixed-case ("Dimes", "HRs", ...).
-- Safe to re-run.

BEGIN;

ALTER TABLE players          ADD COLUMN IF NOT EXISTS "Errors" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE archived_players ADD COLUMN IF NOT EXISTS "Errors" INTEGER NOT NULL DEFAULT 0;

COMMIT;
