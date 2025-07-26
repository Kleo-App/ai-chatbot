ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-17 16:54:23.847';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-17 16:54:23.847';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD COLUMN "generatedPosts" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD COLUMN "preferredPost" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;