import { action } from './_generated/server';
import { v } from 'convex/values';

// This action is kept for completeness but not used
// All LLM calls are now made directly from the frontend
export const sendMessage = action({
  args: {
    message: v.string(),
    conversationHistory: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
    })))
  },
  handler: async (ctx, args) => {
    // Simply return a message indicating that this function is not used
    return {
      text: "This backend action is not used. LLM calls are made directly from the frontend.",
      timestamp: new Date().toISOString(),
    };
  },
});
