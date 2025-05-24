import { NextRequest, NextResponse } from 'next/server';
import { setupAgent, processWithAgent } from '@/lib/langchain/agent';
import { detectSchedulingIntent } from '@/lib/langchain/calendar';

// Allow cross-origin requests to this API
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();
    
    // First check if we should use the LangChain agent based on the message content
    const hasSchedulingIntent = await detectSchedulingIntent(message);
    
    // Decide whether to use LangChain agent or regular LLM processing
    if (hasSchedulingIntent) {
      try {
        // Initialize LangChain agent
        const agent = await setupAgent("not-needed"); // LM Studio doesn't need an API key
        
        // Process with LangChain agent
        const result = await processWithAgent(agent, message, conversationHistory || []);
        
        return NextResponse.json({ 
          text: result.text,
          isSchedulingRequest: true,
        });
      } catch (agentError) {
        console.error('[API] Error in LangChain agent processing:', agentError);
        console.log('[API] Falling back to regular LLM processing');
      }
    }
    
    // Regular LLM processing path (fallback or non-scheduling intent)
    // Try different LM Studio endpoints
    const endpoints = [
      process.env.LLM_API_URL || "http://localhost:1234",
      "http://127.0.0.1:1234"
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
          messages.push({ role: "user", content: message });
        } else {
          // Filter only user and assistant messages (LM Studio requirement)
          messages = conversationHistory.filter(
            (msg: {role: string; content: string}) => msg.role === 'user' || msg.role === 'assistant'
          );
          // Add the current message
          messages.push({ role: "user", content: message });
        }
        
        // Connect to LM Studio with streaming disabled
        llmResponse = await fetch(LLM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages,
            model: "mistral-7b-instruct-v0.3",
            temperature: 0.7,
            max_tokens: 500,
            stream: false,
          }),
          signal: AbortSignal.timeout(20000) // Increased timeout for slower models
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

    return NextResponse.json({ 
      text: assistantMessage,
      isSchedulingRequest: false
    });
    
  } catch (error) {
    console.error('[API] Error in LLM route:', error);
    return NextResponse.json(
      { error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
