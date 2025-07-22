ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-22 05:35:32.506';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-22 05:35:32.506';--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;