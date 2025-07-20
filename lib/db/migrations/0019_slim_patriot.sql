ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-20 19:03:51.470';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-20 19:03:51.470';--> statement-breakpoint
ALTER TABLE "UserProfile" ADD COLUMN "generatedPosts" text;