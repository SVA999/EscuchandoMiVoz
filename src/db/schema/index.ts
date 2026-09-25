import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    role: text('role', { enum: ['admin', 'vocalista'] }).notNull(),
    usernameNormalized: text('username_normalized').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    passwordAlgorithm: text('password_algorithm').notNull(),
    passwordParameters: text('password_parameters').notNull(),
    status: text('status', { enum: ['active', 'inactive'] }).notNull(),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
    passwordChangedAt: integer('password_changed_at', { mode: 'number' }).notNull(),
    deactivatedAt: integer('deactivated_at', { mode: 'number' }),
  },
  (table) => ({
    usernameUnique: uniqueIndex('users_username_normalized_unique').on(table.usernameNormalized),
  }),
)

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
    lastActivityAt: integer('last_activity_at', { mode: 'number' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'number' }),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
  },
  (table) => ({
    tokenUnique: uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
  }),
)

export const authRateLimits = sqliteTable(
  'auth_rate_limits',
  {
    id: text('id').primaryKey(),
    attempts: integer('attempts').notNull(),
    windowStartedAt: integer('window_started_at', { mode: 'number' }).notNull(),
    blockedUntil: integer('blocked_until', { mode: 'number' }),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => ({
    rateLimitUnique: uniqueIndex('auth_rate_limits_id_unique').on(table.id),
  }),
)

export const authEvents = sqliteTable('auth_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  targetUserId: text('target_user_id'),
  actorUserId: text('actor_user_id'),
  occurredAt: integer('occurred_at', { mode: 'number' }).notNull(),
  context: text('context'),
  correlationId: text('correlation_id'),
})
