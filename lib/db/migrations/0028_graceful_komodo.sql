CREATE TABLE "Hook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"tags" text NOT NULL,
	"template" text NOT NULL,
	"image" text,
	"postUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-30 04:17:06.725';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-30 04:17:06.725';