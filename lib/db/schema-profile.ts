import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { user } from './schema';

export const userProfile = pgTable(
  'UserProfile',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Basic profile information
    fullName: text('fullName'),
    jobTitle: text('jobTitle'),
    company: text('company'),
    bio: text('bio'),
    // LinkedIn services (as string instead of array)
    linkedInServices: text('linkedInServices'),
    // Topics (as string instead of array)
    selectedTopics: text('selectedTopics'),
    // AI-generated topics stored as JSON string
    generatedTopics: text('generatedTopics'),
    // AI-generated posts stored as JSON string
    generatedPosts: text('generatedPosts'),
    // Content preferences
    contentType: text('contentType'),
    contentDetails: text('contentDetails'),
    postDetails: text('postDetails'),
    stylePreference: text('stylePreference'),
    preferredHook: text('preferredHook'),
    // AI-generated hooks stored as JSON string
    generatedHooks: text('generatedHooks'),
    // User's preferred post content
    preferredPost: text('preferredPost'),
    // Metadata
    onboardingCompleted: boolean('onboardingCompleted').notNull().default(false),
    lastCompletedStep: text('lastCompletedStep').notNull().default('welcome'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  }
);

export type UserProfile = InferSelectModel<typeof userProfile>;
