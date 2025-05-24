// Calendar tokens storage for Convex

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Save Google Calendar tokens for a user
export const saveCalendarTokens = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiryDate: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, accessToken, refreshToken, expiryDate } = args;
    
    // Check if tokens already exist for this user
    const existingTokens = await ctx.db
      .query('calendarTokens')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();
    
    if (existingTokens) {
      // Update existing tokens
      return await ctx.db.patch(existingTokens._id, {
        accessToken,
        ...(refreshToken && { refreshToken }),
        expiryDate,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Create new tokens
      return await ctx.db.insert('calendarTokens', {
        userId,
        accessToken,
        ...(refreshToken && { refreshToken }),
        expiryDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

// Get Google Calendar tokens for a user
export const getCalendarTokens = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    // Get tokens for the user
    return await ctx.db
      .query('calendarTokens')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();
  },
});
