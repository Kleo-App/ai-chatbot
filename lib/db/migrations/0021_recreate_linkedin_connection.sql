-- Recreate the LinkedInConnection table
CREATE TABLE IF NOT EXISTS "LinkedInConnection" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "accessToken" text NOT NULL,
  "refreshToken" text,
  "expiresAt" timestamp,
  "tokenType" text NOT NULL DEFAULT 'Bearer',
  "scope" text,
  "linkedinId" text NOT NULL,
  "profileUrl" text,
  "firstName" text,
  "lastName" text,
  "profilePicture" text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "LinkedInConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade
);
