-- Migration to handle new onboarding flow with welcome and about steps
-- This migration updates existing users who have completed the old 'welcome' step
-- to be moved to the new 'about' step, since we've inserted a new welcome step

-- Update Onboarding table: 
-- Users who were on 'welcome' step should now be on 'about' step
-- Since 'welcome' is now the first step with the logo
UPDATE "Onboarding" 
SET 
  "currentStep" = 'about',
  "updatedAt" = NOW()
WHERE "currentStep" = 'welcome';

-- Update UserProfile table:
-- Users who had completed 'welcome' as their last step should now show 'about'
-- This ensures they can continue from the right place
UPDATE "UserProfile" 
SET 
  "lastCompletedStep" = 'about',
  "updatedAt" = NOW()  
WHERE "lastCompletedStep" = 'welcome';

-- Note: Users who were on other steps (topics, content, etc.) are not affected
-- The new 'welcome' step becomes the entry point for all new users 