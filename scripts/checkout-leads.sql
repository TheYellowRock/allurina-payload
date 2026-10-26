-- =============================================================================
-- Checkout leads (step 1 of the checkout: name + phone) — sidecar table
--
-- Run ONCE, by hand, in the Supabase SQL editor. Safe to re-run.
-- Lives in the `integrations` schema (created by respondio-sync.sql) for the same
-- reason: Payload's dev schema-push only diffs `public`, so it never sees this table.
--
-- One row per checkout session (`lead_key`, generated in the browser). The row is
-- created when the customer clicks "Continuer" after name + phone, and flipped to
-- `converted` when an order is placed with the same phone.
--
-- Rollback:  drop table integrations.checkout_leads;
-- =============================================================================

create schema if not exists integrations;

create table if not exists integrations.checkout_leads (
  id                bigserial     primary key,
  lead_key          uuid          not null,           -- one per checkout session (browser)
  phone_e164        text          not null,           -- +212XXXXXXXXX
  customer_name     text          not null,
  items             jsonb         not null default '[]'::jsonb,  -- [{title, variantLabel, quantity, price}]
  cart_total        numeric(10,2),
  ip_hash           text,                              -- sha256(ip + secret), for rate limiting only
  status            text          not null default 'new',        -- 'new' | 'converted'
  order_reference   text,                              -- set on conversion
  converted_at      timestamptz,
  respondio_status  text          not null default 'pending',
                    -- 'pending' | 'synced' | 'skipped' | 'failed' | 'rate_limited'
  respondio_error   text,
  contact_id        bigint,
  env               text,                              -- 'production' | 'test'
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),
  constraint checkout_leads_key_unique unique (lead_key)
);

create index if not exists checkout_leads_phone_idx   on integrations.checkout_leads (phone_e164, status);
create index if not exists checkout_leads_created_idx on integrations.checkout_leads (created_at desc);
create index if not exists checkout_leads_ip_idx      on integrations.checkout_leads (ip_hash, created_at);

-- Customer phone numbers: no access through Supabase's anon/authenticated keys.
-- The app connects as `postgres` (DATABASE_URL), which bypasses RLS.
alter table integrations.checkout_leads enable row level security;

create or replace function integrations.checkout_leads_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists checkout_leads_touch on integrations.checkout_leads;
create trigger checkout_leads_touch
  before update on integrations.checkout_leads
  for each row execute function integrations.checkout_leads_touch_updated_at();

-- Sanity check — should return one row with 0:
-- select count(*) from integrations.checkout_leads;

-- Abandoned leads of the last 7 days:
-- select created_at, customer_name, phone_e164, cart_total, respondio_status
--   from integrations.checkout_leads
--  where status = 'new' and created_at > now() - interval '7 days'
--  order by created_at desc;
