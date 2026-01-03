-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "order_index" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing data with sequential indices based on creation date
WITH RankedProducts AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "created_at" ASC) - 1 as new_index
  FROM "products"
)
UPDATE "products"
SET "order_index" = RankedProducts.new_index
FROM RankedProducts
WHERE "products".id = RankedProducts.id;
