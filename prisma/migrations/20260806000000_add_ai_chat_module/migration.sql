-- CreateEnum
CREATE TYPE "AiChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "ai_chat_settings" (
    "id" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(255),

    CONSTRAINT "ai_chat_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_profiles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100) NOT NULL DEFAULT 'custom',
    "base_url" TEXT NOT NULL,
    "api_key_enc" TEXT,
    "model" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" VARCHAR(255),

    CONSTRAINT "ai_provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" VARCHAR(255) NOT NULL,
    "role" "AiChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_chat_messages_session_id_idx" ON "ai_chat_messages"("session_id");
