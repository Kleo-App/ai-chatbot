ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-08-05 03:17:28.843';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-08-05 03:17:28.843';--> statement-breakpoint
ALTER TABLE "Document" ADD COLUMN "workflowRunId" text;