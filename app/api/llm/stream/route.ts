import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

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
        
        // Connect to LM Studio with streaming enabled
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
            stream: true, // Enable streaming
          }),
          signal: AbortSignal.timeout(30000)
        });
        
        if (llmResponse.ok) {
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
      return new Response(
        JSON.stringify({ error: `Failed to connect to LLM: ${errorMessages.join('; ')}` }), 
        { status: 500 }
      );
    }

    // Create a TransformStream to process the SSE data
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const transformStream = new TransformStream({
      start(controller) {
        console.log('[Stream] Starting stream processing');
      },
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        
        // Skip empty lines
        if (!text.trim()) return;
        
        // Process SSE data
        const lines = text.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            
            // Look for the "[DONE]" message
            if (data === "[DONE]") {
              console.log('[Stream] Received [DONE] signal');
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            
            try {
              // Parse the JSON data
              const parsedData = JSON.parse(data);
              
              // Extract the token if it exists
              if (parsedData.choices && parsedData.choices[0]) {
                const content = parsedData.choices[0].delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      },
      flush(controller) {
        console.log('[Stream] Flushing and sending final [DONE] signal');
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
    });

    // Pass the LLM response through the transform stream
    return new Response(llmResponse.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Error in streaming LLM route:', error);
    return new Response(
      JSON.stringify({ error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` }),
      { status: 500 }
    );
  }
}
