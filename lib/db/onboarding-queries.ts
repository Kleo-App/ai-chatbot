import 'server-only';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { onboarding, type Onboarding } from './schema';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Create a new onboarding record for a user
 */
export async function createOnboarding(userId: string): Promise<Onboarding> {
  try {
    const [newOnboarding] = await db
      .insert(onboarding)
      .values({
        userId,
        currentStep: 'welcome',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newOnboarding;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create onboarding record',
    );
  }
}

/**
 * Get the onboarding status for a user
 */
export async function getOnboardingByUserId(userId: string): Promise<Onboarding | null> {
  try {
    const onboardingRecords = await db
      .select()
      .from(onboarding)
      .where(eq(onboarding.userId, userId));
    
    return onboardingRecords.length > 0 ? onboardingRecords[0] : null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get onboarding status',
    );
  }
}

/**
 * Update the onboarding step for a user
 */
export async function updateOnboardingStep(userId: string, step: string): Promise<Onboarding> {
  try {
    const [updatedOnboarding] = await db
      .update(onboarding)
      .set({
        currentStep: step,
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId))
      .returning();
    
    return updatedOnboarding;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update onboarding step',
    );
  }
}

/**
 * Complete the onboarding process for a user
 */
export async function completeOnboarding(userId: string): Promise<Onboarding> {
  try {
    const [completedOnboarding] = await db
      .update(onboarding)
      .set({
        completed: true,
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId))
      .returning();
    
    return completedOnboarding;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to complete onboarding',
    );
  }
}

/**
 * Check if a user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const onboardingRecord = await getOnboardingByUserId(userId);
    return onboardingRecord ? onboardingRecord.completed : false;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to check onboarding completion status',
    );
  }
}
