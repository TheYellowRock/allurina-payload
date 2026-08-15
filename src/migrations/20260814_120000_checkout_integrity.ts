import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * NOTE: this migration was never applied to production — a build-time hang forced it to
 * be removed from `prodMigrations` before it ever ran there. `decrement_stock` and
 * `orders.idempotency_key` were instead created manually via the Supabase SQL editor on
 * 2026-08-15. This file has been corrected to match what was actually created (numeric,
 * not integer — `scarves.stock_quantity` is `numeric`), so that running it later against
 * production is a safe no-op instead of adding a conflicting `decrement_stock` overload.
 *
 * Checkout integrity: an atomic stock-decrement function used by
 * `POST /api/store/checkout` (one `UPDATE ... WHERE stock_quantity >= qty RETURNING`
 * per line, inside the order-creation transaction — no read-then-write race), plus the
 * `idempotency_key` column backing order de-duplication. Both are guarded with
 * `IF NOT EXISTS` so this is safe to run against a database that already has the
 * `idempotencyKey` field pushed via dev schema-push.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar;
  `)
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_idempotency_key_idx"
      ON "orders" USING btree ("idempotency_key");
  `)

  await db.execute(sql`
    CREATE OR REPLACE FUNCTION decrement_stock(p_id integer, p_qty numeric)
    RETURNS numeric AS $$
    DECLARE
      v_new_stock numeric;
    BEGIN
      UPDATE "scarves"
      SET "stock_quantity" = "stock_quantity" - p_qty
      WHERE "id" = p_id AND "stock_quantity" >= p_qty
      RETURNING "stock_quantity" INTO v_new_stock;

      RETURN v_new_stock; -- NULL when no row matched: missing id or insufficient stock
    END;
    $$ LANGUAGE plpgsql;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP FUNCTION IF EXISTS decrement_stock(integer, numeric);`)
  await db.execute(sql`DROP INDEX IF EXISTS "orders_idempotency_key_idx";`)
  await db.execute(sql`ALTER TABLE "orders" DROP COLUMN IF EXISTS "idempotency_key";`)
}
