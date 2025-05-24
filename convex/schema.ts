import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    createdAt: v.string(),
  }).index('by_email', ['email']), // Add this index for email lookups
  sessions: defineTable({
    userId: v.id('users'),
    active: v.boolean(),
    createdAt: v.string(),
  }),
  messages: defineTable({
    userId: v.string(),
    role: v.string(), // 'user' or 'assistant'
    content: v.string(),
    timestamp: v.string(),
    sentiment: v.optional(v.string()), // 'positive', 'neutral', or 'negative'
    actions: v.optional(v.string()), // JSON string of suggested actions
  }).index('by_userId', ['userId']),
});
