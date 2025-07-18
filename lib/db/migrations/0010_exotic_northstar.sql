CREATE TABLE IF NOT EXISTS "Onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"currentStep" varchar(64) DEFAULT 'welcome' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT '2025-07-16 19:06:07.979' NOT NULL,
	"updatedAt" timestamp DEFAULT '2025-07-16 19:06:07.979' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserProfile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"fullName" text,
	"jobTitle" text,
	"company" text,
	"bio" text,
	"linkedInServices" text,
	"selectedTopics" text,
	"contentType" text,
	"contentDetails" text,
	"stylePreference" text,
	"preferredHook" text,
	"onboardingCompleted" boolean DEFAULT false NOT NULL,
	"lastCompletedStep" text DEFAULT 'welcome' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Onboarding" ADD CONSTRAINT "Onboarding_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
