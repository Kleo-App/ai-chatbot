ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-17 16:54:23.847';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-17 16:54:23.847';--> statement-breakpoint
ALTER TABLE "UserProfile" ADD COLUMN "generatedPosts" text;--> statement-breakpoint
ALTER TABLE "UserProfile" ADD COLUMN "preferredPost" text;