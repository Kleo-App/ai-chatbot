-- Create UserProfile table
CREATE TABLE IF NOT EXISTS "UserProfile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
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
