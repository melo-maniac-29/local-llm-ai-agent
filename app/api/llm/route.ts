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
        
        // Handle conversation history correctly
        let messages = [];
        
        // Initialize with a first message if this is a new conversation
        if (!conversationHistory || conversationHistory.length === 0) {
          // Just add the current user message
          messages.push({ 
            role: "user", 
            content: message 
          });
        } else {
          // Filter only user and assistant messages (LM Studio requirement)
          messages = conversationHistory.filter(
            msg => msg.role === 'user' || msg.role === 'assistant'
          );
        }
        
        console.log("[API] Sending messages:", messages);
        
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
