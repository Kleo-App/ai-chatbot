CREATE TABLE IF NOT EXISTS "LinkedInConnection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text,
	"expiresAt" timestamp,
	"tokenType" text DEFAULT 'Bearer' NOT NULL,
	"scope" text,
	"linkedinId" text NOT NULL,
	"profileUrl" text,
	"firstName" text,
	"lastName" text,
	"profilePicture" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "createdAt" SET DEFAULT '2025-07-20 05:36:28.114';--> statement-breakpoint
ALTER TABLE "Onboarding" ALTER COLUMN "updatedAt" SET DEFAULT '2025-07-20 05:36:28.114';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "LinkedInConnection" ADD CONSTRAINT "LinkedInConnection_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
