import { NextRequest } from 'next/server';
import { setupAgent, processWithAgent } from '@/lib/langchain/agent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();
      // First check if this is a scheduling request
    const hasSchedulingIntent = message.toLowerCase().includes('schedule') ||
                               message.toLowerCase().includes('neet') ||
                               message.toLowerCase().includes('exam') ||
                               message.toLowerCase().includes('study');
    if (hasSchedulingIntent) {
      try {
        // Initialize simple LLM
        const llm = await setupAgent();
        
        // Process with simplified agent (non-streaming)
        const result = await processWithAgent(llm, message, conversationHistory || []);
        
        // If we got a valid result, return it
        if (result && result.text) {
          return new Response(
            `data: ${JSON.stringify({ 
              content: result.text,
              isSchedulingRequest: true 
            })}\n\ndata: [DONE]\n\n`,
            {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            }
          );
        }
        
        // If no valid result, throw error to trigger fallback
        throw new Error("Invalid agent response");
      } catch (agentError) {
        console.error('[Stream] Error in agent processing:', agentError);
        // Fall back to regular streaming if agent fails
        console.log('[Stream] Falling back to regular LLM processing');
      }
    }
    
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
        console.log(`[Stream] Trying LLM at: ${LLM_API_URL}`);
        
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
        
        // Connect to LM Studio with streaming enabled
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
            stream: true,
          }),
          signal: AbortSignal.timeout(30000)
        });
        
        if (llmResponse.ok) {
          console.log(`[Stream] Successfully connected to ${LLM_API_URL}`);
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
      console.error('[Stream] Failed to connect to any LLM endpoint:', errorMessages);
      return new Response(
        `data: ${JSON.stringify({ error: `Failed to connect to LLM: ${errorMessages.join('; ')}` })}\n\ndata: [DONE]\n\n`,
        { 
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
          status: 500 
        }
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
        if (!text.trim()) return;
        
        const lines = text.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            
            if (data === "[DONE]") {
              console.log('[Stream] Received [DONE] signal');
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            
            try {
              const parsedData = JSON.parse(data);
              
              // Extract the token if it exists
              if (parsedData.choices && parsedData.choices[0]) {
                const content = parsedData.choices[0].delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              }
            } catch (e) {
              console.error("[Stream] Error parsing SSE data:", e);
              // Don't send parse errors to the client, just log them
              continue;
            }
          }
        }
      },
      
      flush(controller) {
        console.log('[Stream] Flushing and sending final [DONE] signal');
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      }
    });

    // Return the transformed stream response with proper SSE headers
    return new Response(llmResponse.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Stream] Error in streaming LLM route:', error);
    return new Response(
      `data: ${JSON.stringify({ error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` })}\n\ndata: [DONE]\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        status: 500
      }
    );
  }
}
