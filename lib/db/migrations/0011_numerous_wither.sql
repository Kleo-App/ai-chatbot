ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "firstName" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lastName" text;