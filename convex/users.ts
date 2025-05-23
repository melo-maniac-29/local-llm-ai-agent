import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // In a real application, you'd hash the password before storing it
    // and implement proper authentication
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .unique();
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const userId = await ctx.db.insert('users', {
      email: args.email,
      password: args.password, // This should be hashed in production
      createdAt: new Date().toISOString(),
    });
    
    // Create a session
    await ctx.db.insert('sessions', {
      userId,
      active: true,
      createdAt: new Date().toISOString(),
    });
    
    return { userId };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user
    const user = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .unique();
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // In production, you would compare hashed passwords
    if (user.password !== args.password) {
      throw new Error('Invalid password');
    }
    
    // Create a new session
    await ctx.db.insert('sessions', {
      userId: user._id,
      active: true,
      createdAt: new Date().toISOString(),
    });
    
    return { userId: user._id };
  },
});

export const logout = mutation({
  args: {},
  handler: async (ctx) => {
    // In a real application, you'd use proper session management
    // This is a simplified example
    
    // Get the current user's session and deactivate it
    const sessions = await ctx.db
      .query('sessions')
      .filter(q => q.eq(q.field('active'), true))
      .collect();
    
    for (const session of sessions) {
      await ctx.db.patch(session._id, { active: false });
    }
    
    return true;
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    // In a real application, you'd use proper session authentication
    // This is a simplified example
    
    // Find an active session
    const session = await ctx.db
      .query('sessions')
      .filter(q => q.eq(q.field('active'), true))
      .first();
    
    if (!session) {
      return null;
    }
    
    // Get the user
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }
    
    return {
      id: user._id,
      email: user.email,
    };
  },
});
