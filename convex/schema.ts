import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    createdAt: v.string(),
  }).index('by_email', ['email']),

  sessions: defineTable({
    userId: v.id('users'),
    active: v.boolean(),
    createdAt: v.string(),
  }),

  // Keep the individual messages table for backward compatibility
  messages: defineTable({
    userId: v.string(),
    role: v.string(),
    content: v.string(),
    timestamp: v.string(),
    sentiment: v.optional(v.string()),
    actions: v.optional(v.string()),
  }).index('by_userId', ['userId']),

  // Add a new table for storing complete conversations
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    messages: v.string(), // JSON string containing all messages in the conversation
    lastUpdated: v.string(),
    createdAt: v.string(),
  }).index('by_userId', ['userId']),
});
