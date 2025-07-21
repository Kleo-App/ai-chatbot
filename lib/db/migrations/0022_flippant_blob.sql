ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-21 05:48:04.544';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-21 05:48:04.544';--> statement-breakpoint
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "contentType";--> statement-breakpoint
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "contentDetails";