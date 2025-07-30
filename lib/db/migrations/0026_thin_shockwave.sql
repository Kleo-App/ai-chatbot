ALTER TABLE "Message_v2" ALTER COLUMN "attachments" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-28 21:26:18.559';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-28 21:26:18.559';--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "status" varchar DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "scheduledAt" timestamp;--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "publishedAt" timestamp;