ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-20 17:16:33.624';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-20 17:16:33.624';--> statement-breakpoint
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "generatedPosts";--> statement-breakpoint
ALTER TABLE "UserProfile" DROP COLUMN IF EXISTS "preferredPost";