import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Save a message to the database
export const saveMessage = mutation({
  args: {
    userId: v.string(),
    role: v.string(),
    content: v.string(),
    timestamp: v.string(),
    sentiment: v.optional(v.string()),
    actions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, role, content, timestamp, sentiment, actions } = args;
    
    // Save the message with additional structured data
    const messageId = await ctx.db.insert('messages', {
      userId,
      role,
      content,
      timestamp,
      sentiment: sentiment || 'neutral',
      actions: actions || '[]',
    });
    
    return { messageId };
  },
});

// Get messages for a specific user
export const getMessages = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('asc')
      .take(50);
    
    return messages;
  },
});
