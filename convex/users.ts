import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if user already exists
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .first();
      
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      const userId = await ctx.db.insert('users', {
        email: args.email,
        password: args.password, // In a real app, this should be hashed
        createdAt: new Date().toISOString(),
      });
      
      return { userId };
    } catch (error) {
      console.error('Error creating user:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Find the user
      const user = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .first();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      if (user.password !== args.password) {
        throw new Error('Invalid password');
      }
      
      return { userId: user._id };
    } catch (error) {
      console.error('Error logging in:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  },
});

export const logout = mutation({
  args: {},
  handler: async () => {
    return true; // Simple logout, just returning success
  },
});

export const me = query({
  args: {},
  handler: async () => {
    return null; // This would normally use session tokens to identify the user
  },
});
