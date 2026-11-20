-- Per-product "prix barré" (reference price) for the new-collection launch.
--
-- Until now the crossed-out price was a hardcoded rule in the code: any product priced
-- under 95 Dh displayed "~~95~~ <prix>" + badge PROMO. The code now reads it from a new
-- `referencePrice` field on each product instead, so a new-collection product shows its
-- own plain price and old sale scarves keep ~~95~~ 65.
--
-- Run ONCE in the Supabase SQL editor BEFORE starting dev or deploying the new code.
-- Until this runs, the new code would fail reading the missing column.
--
-- Safe to re-run (IF NOT EXISTS + the backfill only fills NULLs). The backfill reproduces
-- the exact current display: every product under 95 Dh gets reference_price = 95. Dev and
-- prod share this database, so this is applied by hand rather than through Payload schema
-- push or migrations.

ALTER TABLE public.scarves ADD COLUMN IF NOT EXISTS reference_price numeric;

UPDATE public.scarves
SET reference_price = 95
WHERE price < 95 AND reference_price IS NULL;

-- Check 1: column exists (one row, data_type = numeric)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'scarves' AND column_name = 'reference_price';

-- Check 2: everything under 95 Dh is backfilled (should return 0)
SELECT count(*) AS missing_backfill
FROM public.scarves
WHERE price < 95 AND reference_price IS NULL;
