import { jsonb, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const runs = pgTable('runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  playerName: text('player_name').notNull(),
  score: integer('score').notNull(),
  levelReached: integer('level_reached').notNull(),
  kills: integer('kills').notNull(),
  durationSec: integer('duration_sec').notNull(),
  seed: text('seed').notNull(),
  items: jsonb('items').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
