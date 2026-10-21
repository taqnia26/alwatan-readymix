import { index, integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const chatConversationsTable = pgTable('chat_conversations', {
  id: serial('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull().default(''),
  email: text('email').notNull().default(''),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({ updatedIndex: index('chat_conversations_updated_idx').on(table.updatedAt) }));
export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => chatConversationsTable.id, { onDelete: 'cascade' }),
  sender: text('sender', { enum: ['visitor', 'admin'] }).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({ conversationIndex: index('chat_messages_conversation_idx').on(table.conversationId, table.id) }));
export const insertChatConversationSchema = createInsertSchema(chatConversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export type ChatConversation = typeof chatConversationsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
