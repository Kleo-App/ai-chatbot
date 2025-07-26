ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-16 19:50:12.196';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-16 19:50:12.196';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD COLUMN "generatedTopics" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;