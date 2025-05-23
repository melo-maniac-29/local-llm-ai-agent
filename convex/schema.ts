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
});
