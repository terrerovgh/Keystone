import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const projects=sqliteTable('projects',{
  owner:text('owner').primaryKey(),payload:text('payload').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull(),
});
export const versions=sqliteTable('versions',{
  id:text('id').primaryKey(),owner:text('owner').notNull(),name:text('name').notNull(),payload:text('payload').notNull(),createdAt:text('created_at').notNull(),
});
