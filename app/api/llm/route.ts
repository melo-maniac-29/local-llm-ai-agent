import { NextRequest, NextResponse } from 'next/server';

// Allow cross-origin requests to this API
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();
    
    // Try different LM Studio endpoints
    const endpoints = [
      "http://localhost:1234",
      "http://127.0.0.1:1234",
      "http://192.168.117.23:1234"
    ];
    
    let llmResponse = null;
    let errorMessages = [];
    
    // Try each endpoint
    for (const baseUrl of endpoints) {
      try {
        const LLM_API_URL = `${baseUrl}/v1/chat/completions`;
        console.log(`[API] Trying LLM at: ${LLM_API_URL}`);
        
        // IMPORTANT: LM Studio only supports 'user' and 'assistant' roles
        // Instead of using a system message, add system instructions as a user message
        const messages = [];
        
        // Add conversation history if provided
        if (conversationHistory && Array.isArray(conversationHistory)) {
          // Filter out any messages that aren't user or assistant
          const validMessages = conversationHistory.filter(
            msg => msg.role === 'user' || msg.role === 'assistant'
          );
          
          // If this is a new conversation, include instructions as a user message
          if (validMessages.length === 1 && validMessages[0].role === 'user') {
            // Add an initial "user" message with instructions
            messages.push({
              role: "user",
              content: "You are Orbital AI, a helpful assistant that specializes in planning, scheduling, and organizing tasks. Be concise and clear in your responses."
            });
            
            // Add an assistant acknowledgment
            messages.push({
              role: "assistant",
              content: "I'm Orbital AI. I'll help you with planning, scheduling, and organizing tasks. How can I assist you today?"
            });
          }
          
          // Add the valid conversation history
          messages.push(...validMessages);
        } else {
          // Add a user message with instructions followed by the actual user query
          messages.push({
            role: "user",
            content: "You are Orbital AI, a helpful assistant. Please respond to this: " + message
          });
        }
        
        console.log("Sending messages to LM Studio:", messages);
        
        // Connect to LM Studio
        llmResponse = await fetch(LLM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages,
            model: "mistral-7b-instruct-v0.3:2",
            temperature: 0.7,
            max_tokens: 500,
            stream: false,
          }),
          // Short timeout to avoid long waits
          signal: AbortSignal.timeout(10000)
        });
        
        if (llmResponse.ok) {
          console.log(`[API] Successfully connected to ${LLM_API_URL}`);
          break;
        } else {
          const errorText = await llmResponse.text();
          errorMessages.push(`${LLM_API_URL} - Error: ${llmResponse.status} ${errorText}`);
          llmResponse = null;
        }
      } catch (error) {
        errorMessages.push(`${baseUrl} - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!llmResponse || !llmResponse.ok) {
      console.error('[API] Failed to connect to any LLM endpoint:', errorMessages);
      return NextResponse.json(
        { error: `Failed to connect to LLM: ${errorMessages.join('; ')}` },
        { status: 500 }
      );
    }

    const data = await llmResponse.json();
    const assistantMessage = data.choices[0].message.content;

    return NextResponse.json({ text: assistantMessage });
    
  } catch (error) {
    console.error('[API] Error in LLM route:', error);
    return NextResponse.json(
      { error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
