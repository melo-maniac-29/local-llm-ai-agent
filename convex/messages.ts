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

// Add new methods for conversation management
export const saveConversation = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    messages: v.string(), // JSON string of all messages
    conversationId: v.optional(v.string()), // For updating existing conversations
  },
  handler: async (ctx, args) => {
    const { userId, title, messages, conversationId } = args;
    const timestamp = new Date().toISOString();
    
    if (conversationId) {
      // Update existing conversation
      await ctx.db.patch(conversationId, {
        messages,
        lastUpdated: timestamp,
      });
      return { conversationId };
    } else {
      // Create new conversation
      const newId = await ctx.db.insert('conversations', {
        userId,
        title,
        messages,
        lastUpdated: timestamp,
        createdAt: timestamp,
      });
      return { conversationId: newId };
    }
  },
});

export const getConversations = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .order('desc', q => q.field('lastUpdated'))
      .collect();
    
    return conversations;
  },
});

export const getConversation = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    return conversation;
  },
});
