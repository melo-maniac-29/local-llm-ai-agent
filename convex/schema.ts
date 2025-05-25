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

  // Main table for storing conversations
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    messages: v.string(), // JSON string containing all messages in the conversation
    lastUpdated: v.string(),
    createdAt: v.string(),
  }).index('by_userId', ['userId']),
    // Table for storing Google Calendar tokens
  calendarTokens: defineTable({
    userId: v.id('users'),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiryDate: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_userId', ['userId']),
});
