-- =============================================================================
-- respond.io outbound sync — sidecar table
--
-- Run ONCE, by hand, in the Supabase SQL editor. Never via Payload migrations.
--
-- Why a separate `integrations` schema instead of `public`:
-- Payload's dev schema-push (`next dev`, or any script that boots Payload without
-- PAYLOAD_MIGRATING=true) diffs the whole `public` schema against the collections
-- config. A table in `public` that Payload doesn't know about shows up as a
-- "DATA LOSS WARNING — accept?" prompt, one Enter away from being dropped — and dev
-- and production share this database. Payload only ever pushes `public`, so a table
-- in its own schema is invisible to it.
--
-- Rollback:  drop schema integrations cascade;
-- =============================================================================

create schema if not exists integrations;

create table if not exists integrations.respondio_sync (
  id           bigserial   primary key,
  order_id     text        not null,          -- orders.order_reference (ALL-XXXX)
  phone_e164   text        not null,          -- +212XXXXXXXXX, or the raw input when invalid
  contact_id   bigint,                        -- respond.io contact id, once known
  env          text        not null default 'production',  -- 'production' | 'test'
  sync_status  text        not null default 'pending',
               -- 'pending' | 'synced' | 'failed' | 'invalid_phone'
  sync_error   text,
  attempts     int         not null default 0,
  synced_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint respondio_sync_order_unique unique (order_id)   -- the idempotency lock
);

create index if not exists respondio_sync_phone_idx  on integrations.respondio_sync (phone_e164);
create index if not exists respondio_sync_status_idx on integrations.respondio_sync (sync_status, attempts);

-- Row Level Security on, with no policies: Supabase's anon/authenticated API keys get no
-- access at all (the table holds customer phone numbers). The app is unaffected — it
-- connects as the `postgres` role via DATABASE_URL, which owns the table and bypasses RLS.
alter table integrations.respondio_sync enable row level security;

create or replace function integrations.respondio_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists respondio_sync_touch on integrations.respondio_sync;
create trigger respondio_sync_touch
  before update on integrations.respondio_sync
  for each row execute function integrations.respondio_touch_updated_at();

-- Sanity check — should return one row with 0:
-- select count(*) from integrations.respondio_sync;
