import { pgTable, uuid, varchar, boolean, timestamp, foreignKey } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { user } from './schema';

export const onboarding = pgTable(
  'Onboarding',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    currentStep: varchar('currentStep', { length: 64 }).notNull().default('welcome'),
    completed: boolean('completed').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().default(new Date()),
    updatedAt: timestamp('updatedAt').notNull().default(new Date()),
  },
  (table) => ({
    userRef: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
    }),
  }),
);

export type Onboarding = InferSelectModel<typeof onboarding>;
