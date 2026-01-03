-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "order_index" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing data with sequential indices
WITH RankedCategories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "created_at" ASC) - 1 as new_index
  FROM "categories"
)
UPDATE "categories"
SET "order_index" = RankedCategories.new_index
FROM RankedCategories
WHERE "categories".id = RankedCategories.id;
