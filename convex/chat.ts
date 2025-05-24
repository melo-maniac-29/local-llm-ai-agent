import { action } from './_generated/server';
import { v } from 'convex/values';

export const sendMessage = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Call your Next.js API that connects to LM Studio
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/llm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: args.message }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        text: data.text,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calling LLM:', error);
      
      // Fallback response if connection fails
      return {
        text: "Sorry, I couldn't connect to the LLM service. Please make sure LM Studio is running locally.",
        timestamp: new Date().toISOString(),
      };
    }
  },
});
