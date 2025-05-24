import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Conversation management functions
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
    
    // Parse and validate messages to catch potential issues
    try {
      const parsedMessages = JSON.parse(messages);
      if (!Array.isArray(parsedMessages)) {
        throw new Error('Messages must be an array');
      }
      
      // Log the number of messages being saved
      console.log(`Saving ${parsedMessages.length} messages for user ${userId}`);
      
      // Log roles to debug message order issues
      console.log(`Message roles: ${parsedMessages.map(m => m.role).join(', ')}`);
      
      if (parsedMessages.length === 0) {
        console.warn("Attempting to save an empty messages array");
      }
    } catch (error) {
      console.error("Error parsing messages:", error);
      throw new Error(`Invalid messages format: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    if (conversationId) {
      // Update existing conversation
      try {
        console.log(`Updating conversation ${conversationId}`);
        await ctx.db.patch(conversationId, {
          messages,
          lastUpdated: timestamp,
        });
        return { conversationId };
      } catch (error) {
        console.error(`Error updating conversation ${conversationId}:`, error);
        throw error;
      }
    } else {
      // Create new conversation
      try {
        console.log(`Creating new conversation for user ${userId}`);
        const newId = await ctx.db.insert('conversations', {
          userId,
          title,
          messages,
          lastUpdated: timestamp,
          createdAt: timestamp,
        });
        return { conversationId: newId };
      } catch (error) {
        console.error(`Error creating conversation for user ${userId}:`, error);
        throw error;
      }
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

export const getLatestConversation = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query('conversations')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .order('desc', q => q.field('lastUpdated'))
      .first();
    
    return conversation;
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

// For backward compatibility with any code still using getMessages
export const getMessages = query({
  args: {
    userId: v.string()
  },
  handler: async (ctx, args) => {
    console.log("WARNING: Using deprecated getMessages method - it now returns an empty array");
    return [];
  },
});

// Add a method to delete conversations
export const deleteConversation = mutation({
  args: {
    conversationId: v.id('conversations'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Security check - ensure user owns this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    if (conversation.userId !== args.userId) {
      throw new Error("Not authorized to delete this conversation");
    }
    
    await ctx.db.delete(args.conversationId);
    return true;
  },
});
