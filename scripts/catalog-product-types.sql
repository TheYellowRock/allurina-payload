-- =====================================================================================
-- Catalog: product types, sizes, colours and variants (pulls and future clothing)
-- =====================================================================================
--
-- Run ONCE in the Supabase SQL editor, BEFORE deploying the matching code and BEFORE
-- running `next dev` with the new Payload config (dev schema-push targets this same
-- shared database and would otherwise try to apply these changes itself).
--
-- Additive only: 5 new tables, 2 new columns on `scarves`, 1 on `categories`, 4 on
-- `payload_locked_documents_rels`, 1 new function. Nothing is dropped or renamed, no
-- existing row is deleted. Existing scarves are backfilled to the "Châles" type.
--
-- DDL mirrors exactly what Payload generates for the new config (produced by letting
-- Payload push the old and new configs into empty Postgres 16 databases and diffing),
-- so Payload sees no difference afterwards. Safe to re-run: every step is guarded.
-- =====================================================================================

BEGIN;

-- ---------- product_types ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_types (
  id          serial PRIMARY KEY,
  name        character varying NOT NULL,
  slug        character varying NOT NULL,
  nav_order   numeric DEFAULT 0,
  size_guide  character varying,
  description character varying,
  updated_at  timestamp(3) with time zone DEFAULT now() NOT NULL,
  created_at  timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS product_types_slug_idx       ON public.product_types USING btree (slug);
CREATE INDEX        IF NOT EXISTS product_types_created_at_idx ON public.product_types USING btree (created_at);
CREATE INDEX        IF NOT EXISTS product_types_updated_at_idx ON public.product_types USING btree (updated_at);

-- ---------- sizes --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sizes (
  id              serial PRIMARY KEY,
  label           character varying NOT NULL,
  slug            character varying NOT NULL,
  sort_order      numeric DEFAULT 0,
  product_type_id integer,
  updated_at      timestamp(3) with time zone DEFAULT now() NOT NULL,
  created_at      timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS sizes_slug_idx         ON public.sizes USING btree (slug);
CREATE INDEX        IF NOT EXISTS sizes_product_type_idx ON public.sizes USING btree (product_type_id);
CREATE INDEX        IF NOT EXISTS sizes_created_at_idx   ON public.sizes USING btree (created_at);
CREATE INDEX        IF NOT EXISTS sizes_updated_at_idx   ON public.sizes USING btree (updated_at);

-- ---------- colors -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.colors (
  id         serial PRIMARY KEY,
  name       character varying NOT NULL,
  slug       character varying NOT NULL,
  hex        character varying NOT NULL,
  updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
  created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS colors_slug_idx       ON public.colors USING btree (slug);
CREATE INDEX        IF NOT EXISTS colors_created_at_idx ON public.colors USING btree (created_at);
CREATE INDEX        IF NOT EXISTS colors_updated_at_idx ON public.colors USING btree (updated_at);

-- ---------- product_variants ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id             serial PRIMARY KEY,
  product_id     integer NOT NULL,
  size_id        integer NOT NULL,
  color_id       integer NOT NULL,
  stock_quantity numeric DEFAULT 0 NOT NULL,
  price_override numeric,
  label          character varying,
  sku            character varying,
  updated_at     timestamp(3) with time zone DEFAULT now() NOT NULL,
  created_at     timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS product_size_color_idx          ON public.product_variants USING btree (product_id, size_id, color_id);
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_idx        ON public.product_variants USING btree (sku);
CREATE INDEX        IF NOT EXISTS product_variants_product_idx    ON public.product_variants USING btree (product_id);
CREATE INDEX        IF NOT EXISTS product_variants_size_idx       ON public.product_variants USING btree (size_id);
CREATE INDEX        IF NOT EXISTS product_variants_color_idx      ON public.product_variants USING btree (color_id);
CREATE INDEX        IF NOT EXISTS product_variants_created_at_idx ON public.product_variants USING btree (created_at);
CREATE INDEX        IF NOT EXISTS product_variants_updated_at_idx ON public.product_variants USING btree (updated_at);

-- ---------- scarves_color_images (array field "Photos par couleur") -------------------
-- The photos themselves go in the existing scarves_rels table (media_id column).
CREATE TABLE IF NOT EXISTS public.scarves_color_images (
  _order     integer NOT NULL,
  _parent_id integer NOT NULL,
  id         character varying PRIMARY KEY,
  color_id   integer
);
CREATE INDEX IF NOT EXISTS scarves_color_images_order_idx     ON public.scarves_color_images USING btree (_order);
CREATE INDEX IF NOT EXISTS scarves_color_images_parent_id_idx ON public.scarves_color_images USING btree (_parent_id);
CREATE INDEX IF NOT EXISTS scarves_color_images_color_idx     ON public.scarves_color_images USING btree (color_id);

-- ---------- new columns on existing tables -------------------------------------------
ALTER TABLE public.scarves    ADD COLUMN IF NOT EXISTS product_type_id integer;
ALTER TABLE public.scarves    ADD COLUMN IF NOT EXISTS has_variants boolean DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS product_type_id integer;
CREATE INDEX IF NOT EXISTS scarves_product_type_idx    ON public.scarves    USING btree (product_type_id);
CREATE INDEX IF NOT EXISTS categories_product_type_idx ON public.categories USING btree (product_type_id);

-- Payload's document-locking table gets one column per collection.
ALTER TABLE public.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS product_types_id    integer;
ALTER TABLE public.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS sizes_id            integer;
ALTER TABLE public.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS colors_id           integer;
ALTER TABLE public.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS product_variants_id integer;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_product_types_id_idx    ON public.payload_locked_documents_rels USING btree (product_types_id);
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_sizes_id_idx            ON public.payload_locked_documents_rels USING btree (sizes_id);
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_colors_id_idx           ON public.payload_locked_documents_rels USING btree (colors_id);
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_product_variants_id_idx ON public.payload_locked_documents_rels USING btree (product_variants_id);

-- ---------- foreign keys (names exactly as Payload generates them) -------------------
DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN SELECT * FROM (VALUES
    ('sizes',                         'sizes_product_type_id_product_types_id_fk',            'product_type_id',     'product_types',    'SET NULL'),
    ('product_variants',              'product_variants_product_id_scarves_id_fk',            'product_id',          'scarves',          'SET NULL'),
    ('product_variants',              'product_variants_size_id_sizes_id_fk',                 'size_id',             'sizes',            'SET NULL'),
    ('product_variants',              'product_variants_color_id_colors_id_fk',               'color_id',            'colors',           'SET NULL'),
    ('scarves_color_images',          'scarves_color_images_parent_id_fk',                    '_parent_id',          'scarves',          'CASCADE'),
    ('scarves_color_images',          'scarves_color_images_color_id_colors_id_fk',           'color_id',            'colors',           'SET NULL'),
    ('scarves',                       'scarves_product_type_id_product_types_id_fk',          'product_type_id',     'product_types',    'SET NULL'),
    ('categories',                    'categories_product_type_id_product_types_id_fk',       'product_type_id',     'product_types',    'SET NULL'),
    ('payload_locked_documents_rels', 'payload_locked_documents_rels_product_types_fk',       'product_types_id',    'product_types',    'CASCADE'),
    ('payload_locked_documents_rels', 'payload_locked_documents_rels_sizes_fk',               'sizes_id',            'sizes',            'CASCADE'),
    ('payload_locked_documents_rels', 'payload_locked_documents_rels_colors_fk',              'colors_id',           'colors',           'CASCADE'),
    ('payload_locked_documents_rels', 'payload_locked_documents_rels_product_variants_fk',    'product_variants_id', 'product_variants', 'CASCADE')
  ) AS t(tbl, name, col, ref, on_delete)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = fk.name) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) ON DELETE %s',
        fk.tbl, fk.name, fk.col, fk.ref, fk.on_delete
      );
    END IF;
  END LOOP;
END $$;

-- ---------- seed data ----------------------------------------------------------------
INSERT INTO public.product_types (name, slug, nav_order) VALUES
  ('Châles', 'chales', 1),
  ('Pulls',  'pulls',  2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.sizes (label, slug, sort_order, product_type_id)
SELECT v.label, v.slug, v.sort_order, (SELECT id FROM public.product_types WHERE slug = 'pulls')
FROM (VALUES
  ('S/M',    's-m',    1),
  ('M/L',    'm-l',    2),
  ('L/XL',   'l-xl',   3),
  ('XL/XXL', 'xl-xxl', 4)
) AS v(label, slug, sort_order)
ON CONFLICT (slug) DO NOTHING;

-- Every existing product is a scarf; every existing category is a scarf category.
UPDATE public.scarves
SET product_type_id = (SELECT id FROM public.product_types WHERE slug = 'chales')
WHERE product_type_id IS NULL;

UPDATE public.categories
SET product_type_id = (SELECT id FROM public.product_types WHERE slug = 'chales')
WHERE product_type_id IS NULL;

-- "Type de produit" is required on every product from now on.
ALTER TABLE public.scarves ALTER COLUMN product_type_id SET NOT NULL;

-- ---------- atomic stock decrement for a variant -------------------------------------
-- Same contract as decrement_stock(): returns the new variant stock, or NULL when the
-- variant doesn't exist or has less than p_qty left (nothing is changed in that case).
-- Also lowers the parent product's total by the same amount, so scarves.stock_quantity
-- stays equal to the sum of its variants (a delta, not a re-sum: safe under concurrency).
CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id integer, p_qty numeric)
RETURNS numeric AS $$
DECLARE
  v_new_stock numeric;
  v_product_id integer;
BEGIN
  UPDATE "product_variants"
  SET "stock_quantity" = "stock_quantity" - p_qty
  WHERE "id" = p_variant_id AND "stock_quantity" >= p_qty
  RETURNING "stock_quantity", "product_id" INTO v_new_stock, v_product_id;

  IF v_new_stock IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE "scarves"
  SET "stock_quantity" = GREATEST("stock_quantity" - p_qty, 0)
  WHERE "id" = v_product_id;

  RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql;

-- No ROW LEVEL SECURITY here on purpose: Payload's dev schema-push turns RLS back off on
-- every table it manages (verified), so enabling it would be undone by the next
-- `next dev` and would show up as a schema difference. Same state as all Payload tables.

COMMIT;

-- ---------- checks (expected results in comments) ------------------------------------
SELECT slug, name FROM public.product_types ORDER BY nav_order;          -- chales, pulls
SELECT label FROM public.sizes ORDER BY sort_order;                      -- S/M, M/L, L/XL, XL/XXL
SELECT count(*) AS scarves_without_type FROM public.scarves WHERE product_type_id IS NULL;  -- 0
