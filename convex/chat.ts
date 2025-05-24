import { action } from './_generated/server';
import { v } from 'convex/values';

export const sendMessage = action({
  args: {
    message: v.string(),
    conversationHistory: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
    })))
  },
  handler: async (ctx, args) => {
    try {
      // Try multiple possible LM Studio endpoints
      const possibleEndpoints = [
        process.env.LLM_API_URL || "http://127.0.0.1:1234",
        "http://localhost:1234",
        "http://127.0.0.1:1234",
        "http://192.168.117.23:1234"
      ];
      
      // Log connection attempts
      console.log("Attempting to connect to LLM with endpoints:", possibleEndpoints);
      
      let response = null;
      let errorMessages = [];
      
      // Try each endpoint until one works
      for (const baseUrl of possibleEndpoints) {
        const LLM_API_URL = `${baseUrl}/v1/chat/completions`;
        const LLM_MODEL = process.env.LLM_MODEL || "mistral-7b-instruct-v0.3:2";
        
        console.log(`Trying LLM at: ${LLM_API_URL} with model: ${LLM_MODEL}`);
        
        // Prepare conversation history with system message
        const messages = [
          { 
            role: "system", 
            content: "You are a helpful assistant called Orbital AI. You're designed to help with planning, scheduling, and organizing tasks. Be concise and clear in your responses." 
          }
        ];
        
        // Add conversation history if provided
        if (args.conversationHistory && args.conversationHistory.length > 0) {
          messages.push(...args.conversationHistory);
        } else {
          // If no history, just add the current message
          messages.push({ role: "user", content: args.message });
        }
        
        try {
          // Call the LLM API
          response = await fetch(LLM_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: messages,
              model: LLM_MODEL,
              temperature: 0.7,
              max_tokens: 500,
              stream: false,
            }),
          });
          
          if (response.ok) {
            console.log(`Successfully connected to ${LLM_API_URL}`);
            break; // We got a successful response, exit the loop
          } else {
            const errorText = await response.text();
            errorMessages.push(`${LLM_API_URL} - Error: ${response.status} ${errorText}`);
            response = null; // Reset for next attempt
          }
        } catch (fetchError) {
          errorMessages.push(`${LLM_API_URL} - ${fetchError.message}`);
        }
      }
      
      // If no successful response from any endpoint
      if (!response || !response.ok) {
        throw new Error(`Failed to connect to any LLM endpoint. Errors: ${errorMessages.join("; ")}`);
      }

      // Process successful response
      const data = await response.json();
      console.log("LLM response received:", data);
      
      // Extract the response content
      const assistantMessage = data.choices && 
        data.choices[0] && 
        data.choices[0].message && 
        data.choices[0].message.content 
          ? data.choices[0].message.content 
          : "No valid response from LLM";
      
      return {
        text: assistantMessage,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error calling LLM:', error);
      
      // Provide a more detailed error message
      return {
        text: `Sorry, I couldn't connect to the LLM service. Error: ${error instanceof Error ? error.message : String(error)}. Please ensure LM Studio is running with the API server enabled on port 1234.`,
        timestamp: new Date().toISOString(),
      };
    }
  },
});
