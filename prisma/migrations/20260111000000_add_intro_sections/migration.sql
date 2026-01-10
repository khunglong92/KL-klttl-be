-- Add introduction section fields to contact_info table
ALTER TABLE "contact_info" ADD COLUMN IF NOT EXISTS "core_values_items" TEXT;
ALTER TABLE "contact_info" ADD COLUMN IF NOT EXISTS "services_items" TEXT;
ALTER TABLE "contact_info" ADD COLUMN IF NOT EXISTS "commitment_intro" TEXT;
ALTER TABLE "contact_info" ADD COLUMN IF NOT EXISTS "core_values_description" TEXT;
ALTER TABLE "contact_info" ADD COLUMN IF NOT EXISTS "services_description" TEXT;
