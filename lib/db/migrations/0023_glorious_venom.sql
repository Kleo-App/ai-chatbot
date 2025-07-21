ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-21 06:14:26.433';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-21 06:14:26.433';--> statement-breakpoint
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "stylePreference";