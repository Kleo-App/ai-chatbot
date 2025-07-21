ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-21 02:16:30.994';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-21 02:16:30.994';--> statement-breakpoint
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "linkedInServices";