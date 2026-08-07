-- AlterTable
ALTER TABLE "ai_provider_profiles" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ai_chat_error_logs" (
    "id" TEXT NOT NULL,
    "session_id" VARCHAR(255),
    "provider_name" VARCHAR(255),
    "error_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_chat_error_logs_created_at_idx" ON "ai_chat_error_logs"("created_at");
