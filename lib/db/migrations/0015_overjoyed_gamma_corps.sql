ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-18 12:37:34.398';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-18 12:37:34.398';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD COLUMN "postDetails" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;