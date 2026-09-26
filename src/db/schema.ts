import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table with Firebase UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default('USER'), // 'USER' | 'AGENT' | 'ADMIN'
  phone: text('phone'),
  avatar: text('avatar'),
  location: text('location').default('Akungba Akoko, Ondo State'),
  bio: text('bio'),
  status: text('status').notNull().default('active'), // 'active' | 'suspended'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Agents profile & tier metrics
export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  businessName: text('business_name').notNull(),
  tier: text('tier').notNull().default('Starter'), // 'Starter' | 'Rising' | 'Pro' | 'Top' | 'Master'
  verified: boolean('verified').notNull().default(false),
  rating: text('rating').notNull().default('5.0'),
  reviewCount: integer('review_count').notNull().default(0),
  completedTransactions: integer('completed_transactions').notNull().default(0),
  responseTime: text('response_time').notNull().default('< 1 hour'),
  responseRate: text('response_rate').notNull().default('99%'),
  bio: text('bio').notNull().default(''),
  location: text('location').notNull().default('Akungba Akoko, Ondo State'),
  phone: text('phone').notNull().default(''),
  idDocumentUrl: text('id_document_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Properties
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id')
    .references(() => agents.id)
    .notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull(),
  propertyType: text('property_type').notNull(), // 'Self-Contained', '1 Bedroom Flat', '2 Bedroom Flat', 'Student Lodge', etc.
  locationCity: text('location_city').notNull(),
  locationState: text('location_state').notNull(),
  locationArea: text('location_area'),
  address: text('address'),
  price: integer('price').notNull(), // In NGN or specified currency
  currency: text('currency').notNull().default('NGN'),
  pricingPeriod: text('pricing_period').notNull().default('year'), // 'year' | 'semester' | 'month' | 'night'
  bedrooms: integer('bedrooms').notNull().default(1),
  bathrooms: integer('bathrooms').notNull().default(1),
  furnished: boolean('furnished').notNull().default(false),
  verified: boolean('verified').notNull().default(true),
  status: text('status').notNull().default('approved'), // 'pending' | 'approved' | 'rejected' | 'suspended'
  images: jsonb('images').$type<string[]>().notNull().default([]),
  amenities: jsonb('amenities').$type<string[]>().notNull().default([]),
  rules: text('rules'),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Saved Properties (Wishlist)
export const savedProperties = pgTable('saved_properties', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  propertyId: integer('property_id')
    .references(() => properties.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Internal ACCOOM Wallet
export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  balance: integer('balance').notNull().default(0),
  currency: text('currency').notNull().default('NGN'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Wallet Ledger (Immutable records)
export const walletLedger = pgTable('wallet_ledger', {
  id: serial('id').primaryKey(),
  walletId: integer('wallet_id')
    .references(() => wallets.id)
    .notNull(),
  amount: integer('amount').notNull(), // Positive for credit, negative for debit
  type: text('type').notNull(), // 'deposit' | 'withdrawal' | 'rent_payment' | 'payout' | 'refund'
  reference: text('reference').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  reference: text('reference').notNull().unique(),
  buyerId: integer('buyer_id')
    .references(() => users.id)
    .notNull(),
  agentId: integer('agent_id')
    .references(() => agents.id)
    .notNull(),
  propertyId: integer('property_id')
    .references(() => properties.id)
    .notNull(),
  amount: integer('amount').notNull(),
  platformFee: integer('platform_fee').notNull().default(0),
  currency: text('currency').notNull().default('NGN'),
  status: text('status').notNull().default('pending'), // 'pending' | 'payment_pending' | 'paid' | 'awaiting_confirmation' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed' | 'refunded'
  paymentProvider: text('payment_provider').notNull().default('Stripe'),
  paymentReference: text('payment_reference'),
  rentDuration: text('rent_duration').notNull().default('1 year'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messaging Conversations
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id),
  buyerId: integer('buyer_id')
    .references(() => users.id)
    .notNull(),
  agentId: integer('agent_id')
    .references(() => agents.id)
    .notNull(),
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Conversation Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => conversations.id)
    .notNull(),
  senderId: integer('sender_id')
    .references(() => users.id)
    .notNull(),
  text: text('text').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('general'), // 'message' | 'transaction' | 'payment' | 'system' | 'review'
  read: boolean('read').notNull().default(false),
  entityId: text('entity_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reviews
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  agentId: integer('agent_id')
    .references(() => agents.id)
    .notNull(),
  propertyId: integer('property_id')
    .references(() => properties.id)
    .notNull(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reports
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id')
    .references(() => users.id)
    .notNull(),
  targetType: text('target_type').notNull(), // 'property' | 'agent' | 'user' | 'message'
  targetId: integer('target_id').notNull(),
  reason: text('reason').notNull(),
  details: text('details'),
  status: text('status').notNull().default('pending'), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Disputes
export const disputes = pgTable('disputes', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id')
    .references(() => transactions.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  reason: text('reason').notNull(),
  evidence: text('evidence'),
  status: text('status').notNull().default('opened'), // 'opened' | 'under_review' | 'resolved_refund' | 'resolved_release' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  agent: one(agents, {
    fields: [users.id],
    references: [agents.userId],
  }),
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  savedProperties: many(savedProperties),
  purchases: many(transactions, { relationName: 'buyerTransactions' }),
  notifications: many(notifications),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  properties: many(properties),
  transactions: many(transactions),
  reviews: many(reviews),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  agent: one(agents, {
    fields: [properties.agentId],
    references: [agents.id],
  }),
  savedBy: many(savedProperties),
  transactions: many(transactions),
  reviews: many(reviews),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
    relationName: 'buyerTransactions',
  }),
  agent: one(agents, {
    fields: [transactions.agentId],
    references: [agents.id],
  }),
  property: one(properties, {
    fields: [transactions.propertyId],
    references: [properties.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  buyer: one(users, {
    fields: [conversations.buyerId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id],
  }),
  property: one(properties, {
    fields: [conversations.propertyId],
    references: [properties.id],
  }),
  messages: many(messages),
}));
