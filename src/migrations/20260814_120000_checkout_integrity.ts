import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
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
    CREATE OR REPLACE FUNCTION decrement_stock(p_id integer, p_qty integer)
    RETURNS integer AS $$
    DECLARE
      v_new_stock integer;
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
  await db.execute(sql`DROP FUNCTION IF EXISTS decrement_stock(integer, integer);`)
  await db.execute(sql`DROP INDEX IF EXISTS "orders_idempotency_key_idx";`)
  await db.execute(sql`ALTER TABLE "orders" DROP COLUMN IF EXISTS "idempotency_key";`)
}
