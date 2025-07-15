-- Clear existing data (since we're switching from NextAuth to Clerk)
DELETE FROM "Vote_v2";
DELETE FROM "Vote";
DELETE FROM "Suggestion";
DELETE FROM "Document";
DELETE FROM "Message_v2";
DELETE FROM "Message";
DELETE FROM "Stream";
DELETE FROM "Chat";
DELETE FROM "User";
--> statement-breakpoint

-- Drop foreign key constraints
ALTER TABLE "Chat" DROP CONSTRAINT IF EXISTS "Chat_userId_User_id_fk";
ALTER TABLE "Document" DROP CONSTRAINT IF EXISTS "Document_userId_User_id_fk";  
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_userId_User_id_fk";
--> statement-breakpoint

-- Change User table
ALTER TABLE "User" ALTER COLUMN "id" SET DATA TYPE text;
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "User" DROP COLUMN IF EXISTS "password";
--> statement-breakpoint

-- Change userId columns to text
ALTER TABLE "Chat" ALTER COLUMN "userId" SET DATA TYPE text;
ALTER TABLE "Document" ALTER COLUMN "userId" SET DATA TYPE text;
ALTER TABLE "Suggestion" ALTER COLUMN "userId" SET DATA TYPE text;
--> statement-breakpoint

-- Re-add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$; 