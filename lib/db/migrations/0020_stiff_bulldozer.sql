ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-20 19:11:46.029';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-20 19:11:46.029';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD COLUMN "preferredPost" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;