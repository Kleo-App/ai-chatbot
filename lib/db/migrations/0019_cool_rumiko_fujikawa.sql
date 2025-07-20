DROP TABLE "LinkedInConnection";--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-20 20:30:09.174';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-20 20:30:09.174';--> statement-breakpoint
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "linkedInServices";