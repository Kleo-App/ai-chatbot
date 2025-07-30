import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

export const hook = pgTable('Hook', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  tags: text('tags').notNull(), // Comma-separated tags
  template: text('template').notNull(),
  image: text('image'),
  postUrl: text('postUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Hook = InferSelectModel<typeof hook>; 