ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-16 19:12:55.063';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-16 19:12:55.063';--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "firstName" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lastName" text;