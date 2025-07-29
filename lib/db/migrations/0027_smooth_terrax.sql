ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-29 04:53:42.322';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-29 04:53:42.322';--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "scheduledTimezone" text;