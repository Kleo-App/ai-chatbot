ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-17 16:41:28.689';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-17 16:41:28.689';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD COLUMN "generatedHooks" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;