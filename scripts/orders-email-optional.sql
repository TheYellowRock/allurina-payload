-- Make the order email optional (checkout no longer requires it).
--
-- Run ONCE in the Supabase SQL editor BEFORE deploying the code that makes the checkout
-- email field optional. Until this runs, an order submitted without an email would be
-- rejected by the database (NOT NULL) and the customer would see an error.
--
-- Safe to re-run. Only relaxes a constraint: no data is changed, nothing is dropped, and
-- existing orders keep their emails. Dev and prod share this database, so this is applied
-- by hand rather than through Payload schema push or migrations.

ALTER TABLE public.orders ALTER COLUMN email DROP NOT NULL;

-- Check: should return is_nullable = YES
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'email';
