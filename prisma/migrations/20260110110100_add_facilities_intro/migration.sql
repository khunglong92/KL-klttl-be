-- AlterTable
ALTER TABLE "contact_info" ADD COLUMN IF NOT EXISTS "facilities_intro" TEXT;
ALTER TABLE "contact_info" ADD COLUMN IF NOT EXISTS "profile_intro" TEXT;
