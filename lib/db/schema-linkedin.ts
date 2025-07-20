import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { user } from './schema';

export const linkedinConnection = pgTable(
  'LinkedInConnection',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // LinkedIn OAuth tokens
    accessToken: text('accessToken').notNull(),
    refreshToken: text('refreshToken'),
    // Token expiration info
    expiresAt: timestamp('expiresAt'),
    tokenType: text('tokenType').notNull().default('Bearer'),
    scope: text('scope'),
    // LinkedIn profile info
    linkedinId: text('linkedinId').notNull(),
    profileUrl: text('profileUrl'),
    firstName: text('firstName'),
    lastName: text('lastName'),
    profilePicture: text('profilePicture'),
    // Connection status
    isActive: boolean('isActive').notNull().default(true),
    // Metadata
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  }
);

export type LinkedInConnection = InferSelectModel<typeof linkedinConnection>; 